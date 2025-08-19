import AsyncStorage from '@react-native-async-storage/async-storage';
import { Device } from './ApiService';

const BOOKMARKS_STORAGE_KEY = '@wol_bookmarks';

export class BookmarkService {
  static async getBookmarks(): Promise<Device[]> {
    try {
      const bookmarksJson = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (bookmarksJson) {
        return JSON.parse(bookmarksJson);
      }
      return [];
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      return [];
    }
  }

  static async saveBookmark(device: Device): Promise<void> {
    try {
      const existingBookmarks = await this.getBookmarks();

      const existingBookmark = existingBookmarks.find(
        bookmark => bookmark.mac === device.mac,
      );

      if (existingBookmark) {
        throw new Error('Device is already bookmarked');
      }

      const updatedBookmarks = [...existingBookmarks, device];
      await AsyncStorage.setItem(
        BOOKMARKS_STORAGE_KEY,
        JSON.stringify(updatedBookmarks),
      );
    } catch (error) {
      console.error('Failed to save bookmark:', error);
      throw error;
    }
  }

  static async removeBookmark(deviceMac: string): Promise<void> {
    try {
      const existingBookmarks = await this.getBookmarks();
      const filteredBookmarks = existingBookmarks.filter(
        bookmark => bookmark.mac !== deviceMac,
      );
      await AsyncStorage.setItem(
        BOOKMARKS_STORAGE_KEY,
        JSON.stringify(filteredBookmarks),
      );
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      throw error;
    }
  }

  static async isBookmarked(deviceMac: string): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks();
      return bookmarks.some(bookmark => bookmark.mac === deviceMac);
    } catch (error) {
      console.error('Failed to check bookmark status:', error);
      return false;
    }
  }
}
