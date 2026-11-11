declare module 'mammoth/mammoth.browser' {
  type ExtractResult = { value: string; messages: Array<{ type: string; message: string }> };
  const mammoth: {
    extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<ExtractResult>;
  };
  export default mammoth;
}
