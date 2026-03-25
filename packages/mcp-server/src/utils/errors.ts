export class ChannelNotJoinedError extends Error {
  constructor() {
    super(
      "No channel joined. Call join_channel first with the channel name shown in the Figma plugin.",
    );
    this.name = "ChannelNotJoinedError";
  }
}

export class PluginDisconnectedError extends Error {
  constructor() {
    super(
      "Figma plugin is not connected. Ensure Figma Desktop is running and the plugin is active.",
    );
    this.name = "PluginDisconnectedError";
  }
}

export class CommandTimeoutError extends Error {
  constructor(command: string, timeoutMs: number) {
    super(
      `Command "${command}" timed out after ${timeoutMs}ms. Check if the Figma plugin is responding.`,
    );
    this.name = "CommandTimeoutError";
  }
}
