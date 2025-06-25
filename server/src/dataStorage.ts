import { promises as fs } from 'fs';
import path from 'path';

const USERS_FILE_PATH = path.join(__dirname, '../data/users.json');

interface UserData {
  anonymousId: string;
  isSubscribed: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

interface Users {
  [anonymousId: string]: UserData;
}

/**
 * ユーザーデータをファイルから読み込む
 */
async function readUsersFile(): Promise<Users> {
  try {
    const data = await fs.readFile(USERS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // ファイルが存在しない場合は空のオブジェクトを返す
      return {};
    }
    console.error('Error reading users file:', error);
    throw error;
  }
}

/**
 * ユーザーデータをファイルに書き込む
 */
async function writeUsersFile(users: Users): Promise<void> {
  await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf-8');
}

/**
 * ユーザーデータを取得する
 */
export async function getUserData(anonymousId: string): Promise<UserData | undefined> {
  const users = await readUsersFile();
  return users[anonymousId];
}

/**
 * ユーザーデータを保存する (更新または新規作成)
 */
export async function saveUserData(userData: UserData): Promise<void> {
  const users = await readUsersFile();
  users[userData.anonymousId] = userData;
  await writeUsersFile(users);
} 