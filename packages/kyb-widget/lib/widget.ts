/// <reference types="vite/client" />
import type {
  WidgetOptions,
  ZkMeWidgetMessageBody,
  Provider,
  ZkMeWidgetMemberIndex,
  ZkMeKybWidget as _ZkMeWidget,
  ZkMeKybWidgetEvent,
  KybFinishedHook,
} from "..";
import { verifyKybWithZkMeServices } from "./verify";
import { ToastManager } from "./toast-manager";

export const ZKME_WIDGET_ORIGIN =
  import.meta.env.VITE_ZKME_WIDGET_ORIGIN || "https://kyb-widget.zk.me/";

function getMaxZIndex() {
  return Math.max(
    ...Array.from(document.querySelectorAll("body *"), (el) =>
      parseFloat(window.getComputedStyle(el).zIndex)
    ).filter((zIndex) => !Number.isNaN(zIndex)),
    0
  );
}

function animation(time: number, startCb?: () => void, doneCb?: () => void) {
  let start: number;
  let deta: number;
  const step = (timestamp: number) => {
    if (!start) {
      start = timestamp;
    }
    deta = timestamp - start;
    if (deta > 0) {
      startCb && startCb();
    }
    if (deta <= time) {
      window.requestAnimationFrame(step);
    } else {
      doneCb && doneCb();
    }
  };
  window.requestAnimationFrame(step);
}

function formatErrorMessage(error: any): string {
  try {
    const r = JSON.stringify(error);
    if (r !== "{}") {
      return r;
    }
  } catch {
    //
  }
  return error?.message || "Unknown error";
}

export class ZkMeKybWidget implements _ZkMeWidget {
  #mchNo: string;
  #name: string;
  #provider: Provider;
  #programNo?: string;
  #endpoint?: string;
  #kybApiEndpoint?: string;
  #accessToken?: string;

  #widgetMask: HTMLElement | null = null;
  #widgetNode: HTMLIFrameElement | null = null;
  #loadingNode: HTMLElement | null = null;
  #customContainer?: string | HTMLElement;

  #visibility: boolean = false;
  #events = new Map<string, (() => void)[]>();
  #channelId: string;

  #isDestroyed = false;
  #toastManager: ToastManager | null = null;

  searchParams?: URLSearchParams;

  static #id: number = 0;

  get mchNo() {
    return this.#mchNo;
  }

  get name() {
    return this.#name;
  }

  get programNo() {
    return this.#programNo;
  }

  get endpoint() {
    return this.#endpoint;
  }

  get accessToken() {
    return this.#accessToken;
  }

  constructor(
    mchNo: string,
    name: string,
    provider: Provider,
    options?: WidgetOptions
  ) {
    this.#mchNo = mchNo;
    this.#name = name;
    this.#provider = provider;
    this.#programNo = options?.programNo;
    this.#endpoint = options?.endpoint;
    this.#kybApiEndpoint = options?.kybApiEndpoint;
    this.#accessToken = options?.accessToken;
    this.#channelId = `${Date.now()}-${ZkMeKybWidget.#id++}`;
    this.#customContainer = options?.rootContainer;
    this.searchParams = options?.searchParams;

    window.addEventListener("message", this.#listener);

    // 初始化 Toast Manager
    this.#toastManager = new ToastManager({
      channelId: this.#channelId,
      widgetOrigin: this.#endpoint || ZKME_WIDGET_ORIGIN,
    });
  }

  #listener = async (ev: MessageEvent<ZkMeWidgetMessageBody>) => {
    if (
      ev.origin !== (this.endpoint || ZKME_WIDGET_ORIGIN) ||
      this.#channelId !== ev.data.channelId
    ) {
      return;
    }
    const {
      id,
      method,
      event,
      verifiedAddress,
      kybStatus,
      zkMeAccount,
      programNo,
    } = ev.data;

    if (event === "prepared") {
      this.#loadingNode?.classList.add("hide");
      animation(300, undefined, () => {
        this.#loadingNode?.remove();
      });
    } else if (
      event === "finished" &&
      verifiedAddress &&
      kybStatus &&
      zkMeAccount
    ) {
      const formattedResults = {
        status: kybStatus,
        associatedAccount: verifiedAddress,
        zkMeAccount,
        programNo: programNo || this.#programNo || "",
      };

      this.hide();
      const callbacks = this.#events.get("kybFinished") || [];
      callbacks.forEach((cb: KybFinishedHook) => {
        cb(formattedResults);
      });

      // Clear the dom when the hide animation ends
      animation(320, undefined, () => {
        this.#clearDom();
      });
    } else if (event === "close") {
      this.hide();
      const callbacks = this.#events.get(event) || [];
      callbacks.forEach((cb) => {
        cb();
      });
    }

    const source = ev.source as Window;

    const handleApprove = (data: any) => {
      source.postMessage(
        {
          id,
          message: "ok",
          data,
        },
        ev.origin
      );
    };

    const handleReject = (message: string) => {
      source.postMessage(
        {
          id,
          message,
        },
        ev.origin
      );
    };

    if (method === "getUserAccounts") {
      try {
        const accounts = await this.#provider.getUserAccounts();
        handleApprove(accounts);
      } catch (err: any) {
        handleReject(formatErrorMessage(err));
      }
    } else if (method === "getAccessToken") {
      try {
        const accessToken = await this.#provider.getAccessToken();
        handleApprove(accessToken);
      } catch (err: any) {
        handleReject(formatErrorMessage(err));
      }
    } else if (method === "getOptions") {
      // kyb
      try {
        handleApprove({
          mchNo: this.#mchNo,
          name: this.#name,
          programNo: this.#programNo,
        });
      } catch (err: any) {
        handleReject(formatErrorMessage(err));
      }
    }
  };

  #generateUrl(accessToken?: string) {
    if (accessToken) {
      this.#accessToken = accessToken;
    }

    const url = new URL(this.#endpoint || ZKME_WIDGET_ORIGIN);

    const params = Array<ZkMeWidgetMemberIndex>(
      "mchNo",
      "name",
      "programNo",
      "accessToken"
    );
    params.forEach((p) => {
      const v = this[p];
      v && url.searchParams.set(p, String(v));
    });

    url.searchParams.set("origin", location.origin);
    url.searchParams.set("channelId", this.#channelId);
    if (this.#customContainer) {
      url.searchParams.set("isCustomContainer", "1");
    }

    if (this.searchParams) {
      return url.toString() + "&" + this.searchParams.toString();
    }

    return url.toString();
  }

  #clearDom() {
    if (this.#widgetMask) {
      this.#widgetMask.remove();
      this.#widgetMask = this.#widgetNode = null;
      this.#visibility = false;
    }
  }

  #getRootContainer() {
    if (this.#customContainer) {
      if (typeof this.#customContainer === "string") {
        const nd = document.querySelector<HTMLElement>(this.#customContainer);
        if (!nd) {
          throw new Error("Invalid root container.");
        }
        return nd;
      } else {
        return this.#customContainer;
      }
    }
  }

  launch() {
    if (this.#widgetNode) {
      this.show();
      return;
    }
    if (this.#isDestroyed) {
      window.addEventListener("message", this.#listener);
      // 重新初始化 Toast Manager
      this.#toastManager = new ToastManager({
        channelId: this.#channelId,
        widgetOrigin: this.#endpoint || ZKME_WIDGET_ORIGIN,
      });
      this.#isDestroyed = false;
    }

    const container = this.#getRootContainer() || document.body;

    this.#widgetMask = document.createElement("div");
    this.#widgetMask.classList.add("zkme-transition");

    if (!this.#customContainer) {
      const maxZIndex = getMaxZIndex();
      this.#widgetMask.classList.add("zkme-widget-mask");
      this.#widgetMask.style.zIndex = `${maxZIndex + 1}`;
    }

    const src = this.#generateUrl();
    let wrapStyle = "";

    if (this.#customContainer) {
      wrapStyle += "; width: auto;";
    }

    this.#widgetMask.innerHTML = `
      <div class="zkme-widget-wrap" style="${wrapStyle}">
        <iframe allow="camera; clipboard-write; geolocation" src="${src}" width="100%" height="100%"></iframe>
      </div>
    `;
    this.#widgetNode = this.#widgetMask.querySelector("iframe");
    this.#loadingNode = this.#widgetMask.querySelector(".zkme-loading");
    container.appendChild(this.#widgetMask);
    this.show();
  }

  relaunch(accessToken?: string) {
    if (this.#widgetNode) {
      this.#widgetNode.src = this.#generateUrl(accessToken);
      this.show();
    }
  }

  hide() {
    if (!this.#visibility) return;
    this.#visibility = false;
    this.#widgetMask?.classList.remove("zkme-fade");
    animation(300, undefined, () => {
      this.#widgetMask && (this.#widgetMask.style.display = "none");
    });
  }

  show() {
    if (!this.#widgetNode) {
      return this.launch();
    }
    if (this.#visibility) return;
    this.#visibility = true;
    const display = this.#customContainer ? "block" : "flex";
    this.#widgetMask && (this.#widgetMask.style.display = display);
    animation(300, () => {
      this.#widgetMask?.classList.add("zkme-fade");
    });
  }

  on(event: "close", callback: () => void): void;
  on(event: "kybFinished", callback: KybFinishedHook): void;
  on(event: ZkMeKybWidgetEvent, callback: any) {
    const callbacks = this.#events.get(event);
    if (callbacks) {
      callbacks.push(callback);
    } else {
      this.#events.set(event, [callback]);
    }
  }

  destroy() {
    window.removeEventListener("message", this.#listener);
    this.#clearDom();
    this.#toastManager?.destroy();
    this.#toastManager = null;
    this.#isDestroyed = true;
  }

  verifyKybWithZkMeServices(
    appId: string,
    userAccount: string,
    accessToken: string,
    programNo?: string
  ) {
    return verifyKybWithZkMeServices(appId, userAccount, accessToken, {
      programNo: programNo || this.#programNo,
      endpoint: this.#kybApiEndpoint,
    });
  }
}
