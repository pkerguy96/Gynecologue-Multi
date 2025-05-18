import JoditEditor from "jodit-react";
const editorConfig = {
  autofocus: true,
};
const MyEditor = (Props) => {
  return <JoditEditor {...Props} config={editorConfig} />;
};

export default MyEditor;
