type RadarNotification = {
  headline: string;
  sourceName: string;
  sourceUrl: string;
  priority: "high" | "urgent";
};

export async function sendRadarNotification({
  headline,
  sourceName,
  sourceUrl,
  priority,
}: RadarNotification) {
  const server =
    process.env.NTFY_SERVER?.replace(/\/$/, "");

  const topic =
    process.env.NTFY_TOPIC;

  /*
   * Notifications are optional.
   * Missing configuration must never
   * cause Radar ingestion to fail.
   */
  if (!server || !topic) {
    console.warn(
      "Radar notification skipped: ntfy is not configured.",
    );

    return;
  }

  try {
    const response =
      await fetch(
        `${server}/${encodeURIComponent(topic)}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "text/plain; charset=utf-8",

            Title:
              priority === "urgent"
                ? "URGENT - Boxing Ring News"
                : "Boxing Ring News Radar",

            Priority:
              priority === "urgent"
                ? "max"
                : "high",

            Tags:
              priority === "urgent"
                ? "rotating_light,boxing_glove"
                : "boxing_glove",

            Click:
              sourceUrl,
          },

          body:
            `${headline}\n\n` +
            `Source: ${sourceName}`,
        },
      );

    if (!response.ok) {
      console.error(
        "Radar notification failed:",
        response.status,
        await response.text(),
      );

      return;
    }

    console.log(
      `Radar ${priority} notification sent:`,
      headline,
    );
  } catch (error) {
    /*
     * A notification problem must never
     * stop stories entering Radar.
     */
    console.error(
      "Radar notification error:",
      error,
    );
  }
}
