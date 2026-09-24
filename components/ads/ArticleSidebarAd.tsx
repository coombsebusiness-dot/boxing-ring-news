"use client";

export default function ArticleSidebarAd() {
  const adHtml = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 300px;
      height: 250px;
      overflow: hidden;
      background: transparent;
    }
  </style>
</head>
<body>
  <script>
    atOptions = {
      'key': 'a823ae0d9ee1237d73074e6e913d4ea3',
      'format': 'iframe',
      'height': 250,
      'width': 300,
      'params': {}
    };
  <\/script>
  <script src="https://www.highrevenueformat.com/a823ae0d9ee1237d73074e6e913d4ea3/invoke.js"><\/script>
</body>
</html>
`;

  return (
    <section className="flex flex-col items-center">
      <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-black/35">
        Advertisement
      </div>

      <iframe
        title="Advertisement"
        srcDoc={adHtml}
        width="300"
        height="250"
        scrolling="no"
        className="block border-0"
      />
    </section>
  );
}
