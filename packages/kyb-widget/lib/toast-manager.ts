import type { ToastData } from "..";

export interface ToastManagerOptions {
  channelId?: string;
  widgetOrigin?: string;
}

export class ToastManager {
  #channelId?: string;
  #widgetOrigin?: string;
  #toastContainer: HTMLElement | null = null;
  #activeToasts = new Map<string, HTMLElement>();
  #messageListener: ((event: MessageEvent) => void) | null = null;

  constructor(options?: ToastManagerOptions) {
    this.#channelId = options?.channelId;
    this.#widgetOrigin = options?.widgetOrigin;
    this.#init();
  }

  #init() {
    // 创建 Toast 容器
    this.#toastContainer = document.createElement("div");
    this.#toastContainer.id = "zkme-toast-container";
    this.#toastContainer.style.cssText = `
      position: fixed;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(this.#toastContainer);

    // 监听来自 widget 的消息
    this.#messageListener = (event: MessageEvent) => {
      // 验证消息来源
      if (this.#widgetOrigin && event.origin !== this.#widgetOrigin) {
        return;
      }

      const { channelId, event: eventType, data } = event.data || {};

      // 验证 channelId
      if (this.#channelId && channelId !== this.#channelId) {
        return;
      }

      if (eventType === "showToast") {
        this.showToast(data);
      } else if (eventType === "hideToast") {
        this.hideToast(data.id);
      }
    };

    window.addEventListener("message", this.#messageListener);
  }

  showToast(data: ToastData) {
    const { id, message, type } = data;

    // 如果已存在相同 ID 的 Toast,先移除
    if (this.#activeToasts.has(id)) {
      this.hideToast(id);
    }

    // 创建 Toast 元素
    const toast = document.createElement("div");
    toast.id = `toast-${id}`;
    toast.style.cssText = `
      background-color: #F2F7F7;
      border-radius: 8px;
      padding: 0 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      height: 36px;
      width: ${type === "success" ? "150px" : "800px"};
      margin-bottom: 8px;
      pointer-events: auto;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    `;

    // 添加图标
    const icon = document.createElement("div");
    icon.style.cssText = "width: 24px; height: 24px; flex-shrink: 0;";

    if (type === "success") {
      icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12.0005 2.1001C17.4679 2.10031 21.8999 6.533 21.8999 12.0005C21.8997 17.4678 17.4678 21.8997 12.0005 21.8999C6.533 21.8999 2.10031 17.4679 2.1001 12.0005C2.1001 6.53287 6.53287 2.1001 12.0005 2.1001Z" fill="#5AE4C7"/>
          <path d="M16.492 8.40659C16.8937 8.77745 16.9188 9.40378 16.5479 9.80555L11.2573 15.537C11.0699 15.7401 10.8062 15.8555 10.5299 15.8555C10.2536 15.8555 9.98982 15.7401 9.80241 15.537L7.45103 12.9897C7.08017 12.5879 7.10522 11.9616 7.50698 11.5908C7.90875 11.2199 8.53508 11.245 8.90594 11.6467L10.5299 13.406L15.093 8.46255C15.4639 8.06079 16.0902 8.03573 16.492 8.40659Z" fill="white"/>
        </svg>
      `;
    } else {
      // error 或 warning 图标
      icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#FF6B6B"/>
          <path d="M12 7v6M12 16h.01" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
    }

    // 添加消息文本
    const messageEl = document.createElement("div");
    messageEl.style.cssText =
      "flex: 1; font-size: 14px; font-weight: 500; color: #002E33;";
    messageEl.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(messageEl);

    // 如果不是 success 类型,添加关闭按钮
    if (type !== "success") {
      const closeBtn = document.createElement("button");
      closeBtn.style.cssText =
        "width: 24px; height: 24px; flex-shrink: 0; cursor: pointer; background: none; border: none; padding: 0;";
      closeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M7.05029 7.0498L16.9498 16.9493" stroke="black" stroke-opacity="0.5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16.9497 7.0498L7.05021 16.9493" stroke="black" stroke-opacity="0.5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      closeBtn.onclick = () => this.hideToast(id);
      toast.appendChild(closeBtn);
    }

    // 添加到容器
    this.#toastContainer?.appendChild(toast);
    this.#activeToasts.set(id, toast);

    // 3秒后自动关闭
    setTimeout(() => this.hideToast(id), 3000);
  }

  hideToast(id: string) {
    const toast = this.#activeToasts.get(id);
    if (toast) {
      toast.remove();
      this.#activeToasts.delete(id);
    }
  }

  destroy() {
    // 移除所有 Toast
    this.#activeToasts.forEach((toast) => toast.remove());
    this.#activeToasts.clear();

    // 移除容器
    this.#toastContainer?.remove();
    this.#toastContainer = null;

    // 移除事件监听
    if (this.#messageListener) {
      window.removeEventListener("message", this.#messageListener);
      this.#messageListener = null;
    }
  }
}

