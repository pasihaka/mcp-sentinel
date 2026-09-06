import type { CheckExecutionResult, CheckStatus } from '../core/types.js';

export interface AlertDestination {
  type: 'slack' | 'discord' | 'webhook';
  url: string;
  name?: string;
}

/**
 * Formats and dispatches alerts to Slack, Discord, and custom webhooks
 */
export class WebhookDispatcher {
  /**
   * Dispatches alerts to all configured destinations
   */
  static async dispatchAll(
    destinations: AlertDestination[],
    serverName: string,
    endpointUrl: string,
    result: CheckExecutionResult,
    previousStatus?: CheckStatus
  ): Promise<void> {
    // Only dispatch if status is non-operational OR if it recovered from an incident
    const isRecovery = Boolean(previousStatus && previousStatus !== 'operational' && result.status === 'operational');
    const isIncident = result.status !== 'operational';

    if (!isRecovery && !isIncident) {
      return;
    }

    const promises = destinations.map(dest => {
      if (dest.type === 'slack') {
        return this.sendSlackAlert(dest.url, serverName, endpointUrl, result, isRecovery);
      } else if (dest.type === 'discord') {
        return this.sendDiscordAlert(dest.url, serverName, endpointUrl, result, isRecovery);
      } else {
        return this.sendGenericWebhook(dest.url, serverName, endpointUrl, result, isRecovery);
      }
    });

    await Promise.allSettled(promises);
  }

  static async sendSlackAlert(
    webhookUrl: string,
    serverName: string,
    endpointUrl: string,
    result: CheckExecutionResult,
    isRecovery: boolean
  ): Promise<void> {
    const statusEmoji = isRecovery
      ? ':white_check_mark: RECOVERED'
      : result.status === 'down'
      ? ':rotating_light: OUTAGE'
      : result.status === 'secret-leak'
      ? ':shield: CRITICAL SECRET LEAK'
      : result.status === 'schema-drift'
      ? ':warning: BREAKING SCHEMA DRIFT'
      : ':warning: DEGRADED';

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${statusEmoji}: MCP Server "${serverName}"`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Endpoint:*\n\`${endpointUrl}\`` },
          { type: 'mrkdwn', text: `*Status:*\n*${result.status.toUpperCase()}*` },
          { type: 'mrkdwn', text: `*Latency:*\n${result.latencyMs}ms` },
          { type: 'mrkdwn', text: `*Tools Registered:*\n${result.toolsCount}` },
        ],
      },
    ];

    if (result.errorMessage) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error Message:*\n>${result.errorMessage}`,
        },
      });
    }

    if (result.diffResult && result.diffResult.diffs.length > 0) {
      const diffLines = result.diffResult.diffs
        .slice(0, 5)
        .map(d => `• *[${d.type.toUpperCase()}]* ${d.message}`)
        .join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Schema Diff (${result.diffResult.diffs.length} change[s]):*\n${diffLines}`,
        },
      });
    }

    if (result.secretFindings.length > 0) {
      const secretLines = result.secretFindings
        .map(s => `• *[${s.severity.toUpperCase()}]* ${s.description} at \`${s.location}\`: \`${s.redactedSnippet}\``)
        .join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Exposed Credentials Detected:*\n${secretLines}`,
        },
      });
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });
  }

  static async sendDiscordAlert(
    webhookUrl: string,
    serverName: string,
    endpointUrl: string,
    result: CheckExecutionResult,
    isRecovery: boolean
  ): Promise<void> {
    const color = isRecovery
      ? 0x44cc11 // Green
      : result.status === 'down'
      ? 0xee2200 // Red
      : result.status === 'secret-leak'
      ? 0xcc0000 // Dark Red
      : result.status === 'schema-drift'
      ? 0xff8800 // Orange
      : 0xddbb00; // Yellow

    const fields: any[] = [
      { name: 'Endpoint', value: `\`${endpointUrl}\``, inline: false },
      { name: 'Status', value: result.status.toUpperCase(), inline: true },
      { name: 'Latency', value: `${result.latencyMs}ms`, inline: true },
      { name: 'Tools', value: `${result.toolsCount}`, inline: true },
    ];

    if (result.errorMessage) {
      fields.push({ name: 'Error', value: result.errorMessage, inline: false });
    }

    if (result.diffResult && result.diffResult.diffs.length > 0) {
      const diffSummary = result.diffResult.diffs
        .slice(0, 5)
        .map(d => `• **[${d.type.toUpperCase()}]** ${d.message}`)
        .join('\n');
      fields.push({ name: 'Schema Changes', value: diffSummary, inline: false });
    }

    if (result.secretFindings.length > 0) {
      const secretSummary = result.secretFindings
        .map(s => `• **[${s.severity.toUpperCase()}]** ${s.description} at \`${s.location}\``)
        .join('\n');
      fields.push({ name: 'Security Findings', value: secretSummary, inline: false });
    }

    const embed = {
      title: `${isRecovery ? 'RECOVERED' : 'ALERT'}: MCP Server "${serverName}"`,
      color,
      fields,
      timestamp: new Date().toISOString(),
      footer: { text: 'MCP Sentinel Edge Monitor' },
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
  }

  static async sendGenericWebhook(
    webhookUrl: string,
    serverName: string,
    endpointUrl: string,
    result: CheckExecutionResult,
    isRecovery: boolean
  ): Promise<void> {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-MCP-Sentinel-Event': isRecovery ? 'recovery' : 'alert' },
      body: JSON.stringify({
        serverName,
        endpointUrl,
        isRecovery,
        result,
      }),
    });
  }

  /**
   * Sends a test verification notification when an alert destination is configured
   */
  static async sendTestAlert(
    destination: AlertDestination,
    serverName: string,
    endpointUrl: string
  ): Promise<boolean> {
    try {
      let payload: any;
      if (destination.type === 'slack') {
        payload = {
          text: `🔔 *MCP Sentinel:* Alerts successfully configured for *${serverName}* (\`${endpointUrl}\`). You will receive real-time notifications here if downtime or breaking schema drift is detected.`,
        };
      } else if (destination.type === 'discord') {
        payload = {
          content: `🔔 **MCP Sentinel:** Alerts successfully configured for **${serverName}** (\`${endpointUrl}\`). You will receive real-time notifications here if downtime or breaking schema drift is detected.`,
        };
      } else {
        payload = {
          event: 'test_alert',
          serverName,
          endpointUrl,
          message: 'MCP Sentinel alerts successfully connected.',
        };
      }

      const res = await fetch(destination.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });

      return res.ok;
    } catch {
      return false;
    }
  }
}
