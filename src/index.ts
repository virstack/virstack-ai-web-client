import { EventEmitter } from "eventemitter3";
import { RetellClient } from "retell-client-js-sdk";

export interface StartCallConfig {
  // Endpoint on your server that creates the call (POST, returns /v3/create-web-call JSON).
  tokenUrl: string;
  captureDeviceId?: string;
  playbackDeviceId?: string;
}

// Thin wrapper over Retell's v3 RetellClient; keeps the old event names
// (call_started, call_ended, error). The agent id stays on the server.
export class VirstackAIWebClient extends EventEmitter {
  private session?: ReturnType<RetellClient["createWebCall"]>;

  public async startCall(config: StartCallConfig): Promise<void> {
    const client = new RetellClient({
      key: "unused", // real key lives on the server behind tokenUrl
      fetch: (url, init) =>
        String(url).endsWith("/v3/create-web-call")
          ? fetch(config.tokenUrl, { method: "POST", headers: { "Content-Type": "application/json" } })
          : fetch(url, init),
    });
    this.session = client.createWebCall({
      agent_id: "", // ignored: the request is replaced by tokenUrl above
      audio: { captureDeviceId: config.captureDeviceId, playbackDeviceId: config.playbackDeviceId },
      hooks: {
        onStatus: (s) => s === "live" && this.emit("call_started"),
        onEnd: () => this.emit("call_ended"),
        onError: (e) => this.emit("error", e.message),
        onAgentStartTalking: () => this.emit("agent_start_talking"),
        onAgentStopTalking: () => this.emit("agent_stop_talking"),
      },
    });
    await this.session.ready.catch(() => {}); // failures already arrive via onError
  }

  public stopCall(): void {
    this.session?.end();
  }
  public mute(): void {
    this.session?.mute();
  }
  public unmute(): void {
    this.session?.unmute();
  }
}

export default VirstackAIWebClient;
