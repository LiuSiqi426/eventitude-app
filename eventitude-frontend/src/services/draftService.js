class DraftService {
  constructor() {
    this.storagePrefix = 'eventDrafts_';
  }

  getCurrentUserId() {
    return localStorage.getItem('userId') || 'anonymous';
  }

  getStorageKey() {
    return `${this.storagePrefix}${this.getCurrentUserId()}`;
  }

  // 保存草稿
  saveDraft(draftData) {
    const userId = this.getCurrentUserId();
    if (userId === 'anonymous') {
      throw new Error('用户未登录，无法保存草稿');
    }

    const draft = {
      ...draftData,
      id: Date.now(),
      userId: userId,
      savedAt: new Date().toISOString()
    };

    const drafts = this.getDrafts();
    drafts.unshift(draft);
    this.saveToStorage(drafts);
    
    return draft;
  }

  // 获取所有草稿
  getDrafts() {
    const userId = this.getCurrentUserId();
    if (userId === 'anonymous') {
      return [];
    }

    const storageKey = this.getStorageKey();
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  }

  // 删除草稿
  deleteDraft(draftId) {
    const drafts = this.getDrafts().filter(draft => draft.id !== draftId);
    this.saveToStorage(drafts);
  }

  // 清空所有草稿
  clearAllDrafts() {
    const storageKey = this.getStorageKey();
    localStorage.removeItem(storageKey);
  }

  // 清理过时草稿（超过30天）
  cleanupOldDrafts() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const drafts = this.getDrafts().filter(draft => {
      const draftDate = new Date(draft.savedAt);
      return draftDate > thirtyDaysAgo;
    });

    this.saveToStorage(drafts);
  }

  // 私有方法：保存到存储
  saveToStorage(drafts) {
    const storageKey = this.getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(drafts));
  }
}

export default new DraftService();