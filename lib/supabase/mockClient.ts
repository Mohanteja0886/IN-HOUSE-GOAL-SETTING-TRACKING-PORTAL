// Mock Supabase Client for GoalStream Offline/Demo Mode
// Perfectly matches @supabase/supabase-js interface and behavior

import { getMockData, saveMockData, MockUser } from './mockDb';

function getCookieValue(name: string, cookieString?: string): string | null {
  const str = cookieString || (typeof document !== 'undefined' ? document.cookie : '');
  const match = str.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  }
}

function deleteCookie(name: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

// Keep a simple global in-memory listener list for auth changes
const authListeners: Array<(event: string, session: any) => void> = [];

class MockQueryBuilder {
  private table: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitCount: number | null = null;
  private cookieStr?: string;

  constructor(table: string, cookieStr?: string) {
    this.table = table;
    this.cookieStr = cookieStr;
  }

  select(fields?: string) {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push(item => {
      const itemVal = item[column];
      return itemVal === value;
    });
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderCol = column;
    this.orderAsc = ascending;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async execute() {
    let data = getMockData(this.table);

    // Apply filters
    for (const filter of this.filters) {
      data = data.filter(filter);
    }

    // Apply sorting
    if (this.orderCol) {
      data = [...data].sort((a, b) => {
        const valA = a[this.orderCol!];
        const valB = b[this.orderCol!];
        if (valA === valB) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;
        const compare = valA < valB ? -1 : 1;
        return this.orderAsc ? compare : -compare;
      });
    }

    // Apply limit
    if (this.limitCount !== null) {
      data = data.slice(0, this.limitCount);
    }

    // Support nested comments and achievements on goals select
    if (this.table === 'goals') {
      const allAchievements = getMockData('achievements');
      const allComments = getMockData('comments');

      data = data.map(goal => {
        // Find matching achievements
        const achs = allAchievements.filter(ach => ach.goal_id === goal.id);
        
        // Find matching comments
        const comments = allComments.filter(com => com.goal_id === goal.id);

        return {
          ...goal,
          achievements: achs, // array or single will be parsed in goals.ts query handler
          comments: comments
        };
      });
    }

    return { data, error: null };
  }

  // Chainable promise execution
  then(onfulfilled?: (value: any) => any, onrejected?: (value: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async single() {
    const { data } = await this.execute();
    if (!data || data.length === 0) {
      return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
    }
    return { data: data[0], error: null };
  }

  async maybeSingle() {
    const { data } = await this.execute();
    return { data: data[0] || null, error: null };
  }

  async insert(item: any) {
    const tableData = getMockData(this.table);
    const newItems = Array.isArray(item) ? item : [item];

    const processedItems = newItems.map(x => ({
      id: x.id || (x.goal_id ? `ach_${Math.random().toString(36).substr(2, 9)}` : crypto.randomUUID()),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...x
    }));

    tableData.push(...processedItems);
    saveMockData(this.table, tableData);

    const firstItem = processedItems[0];
    const result = {
      data: Array.isArray(item) ? processedItems : firstItem,
      error: null,
      select: () => ({
        single: () => Promise.resolve({ data: firstItem, error: null }),
        maybeSingle: () => Promise.resolve({ data: firstItem, error: null }),
        then: (resolve: any) => resolve({ data: processedItems, error: null })
      })
    };
    return result;
  }

  async update(updateFields: any) {
    const tableData = getMockData(this.table);
    let updatedCount = 0;
    const updatedData = tableData.map(item => {
      const matches = this.filters.every(filter => filter(item));
      if (matches) {
        updatedCount++;
        return {
          ...item,
          ...updateFields,
          updated_at: new Date().toISOString()
        };
      }
      return item;
    });

    saveMockData(this.table, updatedData);
    return { data: null, error: null };
  }

  async delete() {
    const tableData = getMockData(this.table);
    const remainingData = tableData.filter(item => {
      const matches = this.filters.every(filter => filter(item));
      return !matches;
    });
    saveMockData(this.table, remainingData);
    return { data: null, error: null };
  }
}

export class MockSupabaseClient {
  private cookieStr?: string;

  constructor(cookieStr?: string) {
    this.cookieStr = cookieStr;
  }

  from(table: string) {
    return new MockQueryBuilder(table, this.cookieStr);
  }

  get auth() {
    const self = this;
    return {
      async getSession() {
        const userId = getCookieValue('sb-mock-user-id', self.cookieStr) || 
                       (typeof window !== 'undefined' ? localStorage.getItem('sb_mock_session_user_id') : null);
        
        if (!userId) {
          return { data: { session: null }, error: null };
        }

        const users = getMockData('users');
        const user = users.find(u => u.id === userId);

        if (!user) {
          return { data: { session: null }, error: null };
        }

        const session = {
          access_token: 'mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          user: {
            id: user.id,
            email: user.name.toLowerCase().replace(' ', '') + '@goalstream.com',
            user_metadata: { name: user.name },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          }
        };

        return { data: { session }, error: null };
      },

      async getUser() {
        const { data: { session } } = await this.getSession();
        return { data: { user: session ? session.user : null }, error: null };
      },

      onAuthStateChange(callback: (event: string, session: any) => void) {
        authListeners.push(callback);
        
        // Immediately fire with current session
        this.getSession().then(({ data: { session } }) => {
          callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        });

        return {
          data: {
            subscription: {
              unsubscribe() {
                const idx = authListeners.indexOf(callback);
                if (idx !== -1) authListeners.splice(idx, 1);
              }
            }
          }
        };
      },

      async signInWithPassword({ email }: { email: string }) {
        const users = getMockData('users') as MockUser[];
        // Find matching profile based on seeded credentials
        let matchedUser: MockUser | undefined;
        if (email.startsWith('sarah')) {
          matchedUser = users.find(u => u.id === '00000000-0000-0000-0000-000000000001');
        } else if (email.startsWith('michael')) {
          matchedUser = users.find(u => u.id === '00000000-0000-0000-0000-000000000002');
        } else if (email.startsWith('manager')) {
          matchedUser = users.find(u => u.id === '00000000-0000-0000-0000-000000000003');
        } else if (email.startsWith('admin')) {
          matchedUser = users.find(u => u.id === '00000000-0000-0000-0000-000000000004');
        }

        if (!matchedUser) {
          return { data: { session: null, user: null }, error: { message: 'User not found in seeded profiles.' } };
        }

        // Save session details
        if (typeof window !== 'undefined') {
          localStorage.setItem('sb_mock_session_user_id', matchedUser.id);
        }
        setCookie('sb-mock-user-id', matchedUser.id, 604800);
        setCookie('sb-mock-user-role', matchedUser.role, 604800);

        const { data: { session } } = await this.getSession();

        // Notify listeners
        authListeners.forEach(listener => listener('SIGNED_IN', session));

        return { data: { session, user: session?.user }, error: null };
      },

      async signOut() {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sb_mock_session_user_id');
        }
        deleteCookie('sb-mock-user-id');
        deleteCookie('sb-mock-user-role');

        // Notify listeners
        authListeners.forEach(listener => listener('SIGNED_OUT', null));

        return { error: null };
      }
    };
  }
}
