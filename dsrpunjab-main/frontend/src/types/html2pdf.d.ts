declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: { scale?: number; useCORS?: boolean; letterRendering?: boolean; scrollX?: number; scrollY?: number };
    jsPDF?: { unit?: string; format?: string; orientation?: string };
    pagebreak?: { mode?: string[] };
  }
  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance;
    from(element: Element | null): Html2PdfInstance;
    save(): Promise<void>;
    then(fn: () => void): Html2PdfInstance;
    catch(fn: (err: any) => void): Html2PdfInstance;
  }
  function html2pdf(): Html2PdfInstance;
  export = html2pdf;
}
