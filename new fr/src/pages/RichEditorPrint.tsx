import PrintHeader from "../components/PrintHeader";

/* function $tempkate(opts: any) {
  const { lang, dir, size, margin, css, page } = opts;
  return `<!DOCTYPE html><html lang="${lang}"dir="${dir}"><head><meta charset="UTF-8"/><meta http-equiv="X-UA-Compatible"content="IE=edge"/><meta name="viewport"content="width=device-width, initial-scale=1.0"/><style>@page{size:${size.page};margin:${margin}}#page{width:100%}#head{height:${size.head}}#foot{height:${size.foot}}</style>${css}</head><body><table id="page"><thead><tr><td><div id="head"></div></td></tr></thead><tbody><tr><td><main id="main">${page}</main></td></tr></tbody><tfoot><tr><td><div id=foot></div></td></tr></tfoot></table></body></html>`;
} */
function $tempkate(opts: any) {
  const { lang, dir, size, margin, css, page } = opts;
  return `<!DOCTYPE html><html lang="${lang}" dir="${dir}"><head>
    <meta charset="UTF-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>@page{size:${
      size.page
    };margin:${margin}}#page{width:100%}#head{height:${
    size.head
  }}#foot{height:${size.foot}}</style>
    ${css.join("")} 
  </head><body>
    <table id="page">
      <thead><tr><td><div id="head"></div></td></tr></thead>
      <tbody><tr><td><main id="main">${page}</main></td></tr></tbody>
      <tfoot><tr><td><div id="foot"></div></td></tr></tfoot>
    </table>
  </body></html>`;
}

function Print(target: any, callback: Function) {
  const page = document.querySelector(target);

  var iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);
  var iframeDoc = iframe.contentDocument || iframe?.contentWindow?.document;
  iframeDoc?.open();
  iframeDoc?.write(
    $tempkate({
      size: {
        page: "A5",
        head: "0px",
        foot: "0px",
      },
      page: page.innerHTML,
      margin: "16px 24px 16px 24px",
      css: [
        '<link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">',

        '<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.16/dist/tailwind.min.css" rel="stylesheet">',
      ],
    })
  );
  iframeDoc?.close();
  iframe.onload = function () {
    iframe?.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
      callback();
    }, 1000);
  };
}

const PrintGlobal = ({
  title,
  content,
  name,
  items = [],
  render = (item, index) => item,
}) => {
  const userLogin = JSON.parse(localStorage.getItem("user_login") || "{}");
  const shouldPrintHeader =
    userLogin?.headerprint === true || userLogin?.headerprint === "true";

  return (
    <div
      id="page"
      style={{
        display: "none",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {shouldPrintHeader && <PrintHeader name={name} />}
        <span
          style={{
            display: "block",
            margin: "auto",
            fontSize: 20,
          }}
        >
          {title}
        </span>
        <div
          style={{
            display: "block",
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: content }}></div>
        </div>

        {items.length > 0 && (
          <div className="w-full flex flex-col gap-4 mt-4">
            <div className="w-full flex flex-col gap-2">
              {items.map((item: any, index: number) => render(item, index))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RichEditorPrint = () => {
  return {
    Printable: PrintGlobal,
    print: (callback = () => {}) => {
      Print("#page", callback);
    },
  };
};

export default RichEditorPrint;
