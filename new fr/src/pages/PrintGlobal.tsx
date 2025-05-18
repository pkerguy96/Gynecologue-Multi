function $tempkate(opts: any) {
  const { lang, dir, size, margin, css, page } = opts;
  return `<!DOCTYPE html><html lang="${lang}"dir="${dir}"><head><meta charset="UTF-8"/><meta http-equiv="X-UA-Compatible"content="IE=edge"/><meta name="viewport"content="width=device-width, initial-scale=1.0"/><style>@page{size:${size.page};margin:${margin}}#page{width:100%}#head{height:${size.head}}#foot{height:${size.foot}}</style>${css}</head><body><table id="page"><thead><tr><td><div id="head"></div></td></tr></thead><tbody><tr><td><main id="main">${page}</main></td></tr></tbody><tfoot><tr><td><div id=foot></div></td></tr></tfoot></table></body></html>`;
}

function Print(target: any, callback: Function, style) {
  const page = document.querySelector(target);

  var iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);
  var iframeDoc = iframe.contentDocument || iframe?.contentWindow?.document;
  iframeDoc?.open();
  iframeDoc?.write(
    $tempkate({
      size: {
        page: style.page,
        head: style.head,
        foot: style.foot,
      },
      page: page.innerHTML,
      margin: style.margin,
      css: [
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
  date = null,
  name = "",
  items = [],
  render = (item, index) => item,
  renderTop = () => <></>,
  page = null,
}) => {
  const userLogin = JSON.parse(localStorage.getItem("user_login") || "{}");
  const shouldPrintHeader =
    userLogin?.headerprint === true || userLogin?.headerprint === "true";

  if (!date) {
    const FormattedDate = new Date().toISOString().split("T")[0].split("-");
    date = FormattedDate[0] + "/" + FormattedDate[1] + "/" + FormattedDate[2];
  }

  return (
    <div id="page" className="hidden w-full flex-col gap-4 bg-white rounded-sm">
      <div className="w-full flex flex-col gap-14 ">
        {shouldPrintHeader && (
          <div
            className="w-full flex  items-start flex-col"
            style={{ paddingInlineStart: "50%", gap: "0.10rem" }}
          >
            <p className="font-semibold">{date}</p>
            <p className="font-semibold">{name}</p>
          </div>
        )}
        {renderTop()}
        <div className="w-full flex flex-col gap-4">
          <div className="w-full flex flex-col gap-2">
            {page
              ? page()
              : items.map((item: any, index: number) => render(item, index))}
          </div>
        </div>
      </div>
    </div>
  );
};

const usePrint = () => {
  return {
    Printable: PrintGlobal,
    print: (
      callback = () => {},
      style = {
        page: "A5",
        head: "80px",
        foot: "80px",
        margin: "10mm 10mm 10mm 10mm",
      }
    ) => {
      Print("#page", callback, style);
    },
  };
};

export default usePrint;
