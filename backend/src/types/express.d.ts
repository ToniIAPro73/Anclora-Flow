import { IUser } from './user.js';

declare global {
  namespace Express {
    // Extend the User interface that Passport adds to Request
    // Using Partial because not all fields might be present in all contexts
    interface User extends Partial<IUser> {}
  }
}

export {};
