"use client";

export default function ArticleLeaderboardAd() {
  const adHtml = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 728px;
      height: 90px;
      overflow: hidden;
      background: transparent;
    }
  </style>
</head>
<body>
  <script>
    atOptions = {
      'key': '2ccff4cb6c8067c3ab58a4c8fb98380e',
      'format': 'iframe',
      'height': 90,
      'width': 728,
      'params': {}
    };
  <\/script>
  <script src="https://www.highrevenueformat.com/2ccff4cb6c8067c3ab58a4c8fb98380e/invoke.js"><\/script>
</body>
</html>
`;

  return (
    <div className="hidden flex-col items-center lg:flex">
      <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-black/35">
        Advertisement
      </div>

      <iframe
        title="Advertisement"
        srcDoc={adHtml}
        width="728"
        height="90"
        scrolling="no"
        className="block border-0"
      />
    </div>
  );
}
