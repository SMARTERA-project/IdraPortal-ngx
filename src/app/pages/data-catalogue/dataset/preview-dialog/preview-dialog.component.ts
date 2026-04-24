import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { NbButtonModule, NbCardModule, NbDialogRef, NbSpinnerModule } from '@nebular/theme';
import { TranslateModule } from '@ngx-translate/core';
import { decodeBytesToText, extractPayloadEntries, ExtractedFileEntry, pickEntryByExtensions, pickFirstTextEntry } from '../utils/compressed-content.util';
import { DCATDistribution } from '../../model/dcatdistribution';
import { DataCataglogueAPIService } from '../../services/data-cataglogue-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  imports: [NbSpinnerModule, NbCardModule, TranslateModule, NbButtonModule],
  selector: 'ngx-remoteCatalogue-dialog',
  templateUrl: 'preview-dialog.component.html',
  styleUrls: ['preview-dialog.component.scss'],
})
export class PreviewDialogComponent implements AfterViewInit, OnDestroy {

  @Input() title: string;
  @Input() url: string;
  @Input() text: string;
  @Input() distribution: DCATDistribution;
  @ViewChild('iframeBody', { static: false }) iframeBody: ElementRef<HTMLElement>;
  loading: boolean;
  private readonly maxNetworkPreviewBytes = 15 * 1024 * 1024;
  private readonly maxDecodedPreviewChars = 20 * 1024 * 1024;
  private readonly maxTableRows = 1000;
  private activeObjectUrl: string | null = null;

  constructor(
    protected ref: NbDialogRef<PreviewDialogComponent>,
    private restApi: DataCataglogueAPIService,
  ) {}

  close() {
    this.releaseObjectUrl();
    this.ref.close();
  }
  ngOnDestroy(): void {
    this.releaseObjectUrl();
  }
  async ngAfterViewInit() {
    if (this.text !== undefined && this.text !== null) {
      this.renderDecodedText(this.text, this.url || this.title || '', '');
      return;
    }

    if (!this.url) {
      this.renderErrorMessage('No URL available for preview.');
      return;
    }

    await this.loadAndRenderUrlPreview();
  }

  private async loadAndRenderUrlPreview(): Promise<void> {
    this.loading = true;

    try {
      const response = this.distribution
        ? await firstValueFrom(this.restApi.downloadFromUriAsBlob(this.distribution))
        : await firstValueFrom(this.restApi.downloadFromUriByUrlAsBlob(this.url));
      const payloadBlob = response.body;

      if (!payloadBlob) {
        throw new Error('Remote file response is empty');
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > this.maxNetworkPreviewBytes) {
        this.renderTooLargeMessage();
        this.loading = false;
        return;
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (this.isGoogleViewerOnlyContent(contentType)) {
        this.loading = false;
        this.renderGoogleViewer();
        return;
      }

      const buffer = await payloadBlob.arrayBuffer();
      if (buffer.byteLength > this.maxNetworkPreviewBytes) {
        this.renderTooLargeMessage();
        this.loading = false;
        return;
      }

      const payloadBytes = new Uint8Array(buffer);
      if (this.isPdfContent(this.url, contentType, payloadBytes)) {
        this.loading = false;
        this.renderPdfFromBytes(payloadBytes);
        return;
      }

      const extracted = await extractPayloadEntries(buffer, this.url);
      const pdfEntry = pickEntryByExtensions(extracted.entries, ['pdf']) || extracted.entries.find((entry) => this.isPdfBytes(entry.bytes));
      if (pdfEntry) {
        this.loading = false;
        this.renderPdfFromBytes(pdfEntry.bytes);
        return;
      }

      const previewEntry = this.selectPreviewEntry(extracted.entries, contentType);

      if (!previewEntry) {
        this.loading = false;
        this.renderGoogleViewer();
        return;
      }

      const decodedText = decodeBytesToText(previewEntry.bytes);
      if (decodedText.length > this.maxDecodedPreviewChars) {
        this.renderTooLargeMessage();
        this.loading = false;
        return;
      }

      this.renderDecodedText(decodedText, previewEntry.name || this.url, contentType);
      this.loading = false;
    } catch (error) {
      console.error(error);
      this.loading = false;
      if (this.isHttpStatus(error, 413)) {
        this.renderTooLargeMessage();
        return;
      }
      if (this.isLikelyTextPreview(this.url)) {
        this.renderErrorMessage('Unable to load text preview from source file.');
      } else {
        this.renderGoogleViewer();
      }
    }
  }

  private selectPreviewEntry(entries: ExtractedFileEntry[], contentType: string): ExtractedFileEntry | undefined {
    const preferredExtensions = this.getPreferredExtensions(contentType);
    const preferred = pickEntryByExtensions(entries, preferredExtensions);

    if (preferred) {
      return preferred;
    }

    return pickFirstTextEntry(entries, preferredExtensions);
  }

  private getPreferredExtensions(contentType: string): string[] {
    const preferred = ['csv', 'tsv', 'json', 'txt', 'xml', 'rdf'];
    const lowerUrl = (this.url || '').toLowerCase();

    if (lowerUrl.includes('.csv')) {
      return ['csv', ...preferred];
    }
    if (lowerUrl.includes('.tsv')) {
      return ['tsv', ...preferred];
    }
    if (lowerUrl.includes('.json') || contentType.includes('json')) {
      return ['json', 'geojson', ...preferred];
    }
    if (lowerUrl.includes('.txt')) {
      return ['txt', ...preferred];
    }
    if (lowerUrl.includes('.xml')) {
      return ['xml', ...preferred];
    }
    if (lowerUrl.includes('.rdf')) {
      return ['rdf', 'xml', ...preferred];
    }

    return preferred;
  }

  private renderDecodedText(decodedText: string, fileName: string, contentType: string): void {
    const container = this.getContainer();
    if (!container) {
      return;
    }

    container.innerHTML = '';

    if (this.isJsonText(decodedText, fileName, contentType)) {
      const pre = document.createElement('pre');
      pre.setAttribute('style', 'height: 70vh;width: 100%;overflow: auto;');
      pre.setAttribute('readonly', 'true');

      try {
        pre.textContent = JSON.stringify(JSON.parse(decodedText), null, 2);
      } catch (_error) {
        pre.textContent = decodedText;
      }

      container.appendChild(pre);
      return;
    }

    if (this.isDelimitedText(decodedText, fileName, contentType)) {
      const table = this.csvToTable(decodedText);
      table.setAttribute('style', 'height: 70vh;width: 100%;overflow: auto;display: block;');
      container.appendChild(table);
      return;
    }

    if (this.isXmlText(decodedText, fileName, contentType)) {
      const pre = document.createElement('pre');
      pre.setAttribute('style', 'height: 70vh;width: 100%;overflow: auto;');
      pre.setAttribute('readonly', 'true');
      pre.textContent = this.tryFormatXml(decodedText);
      container.appendChild(pre);
      return;
    }

    const pre = document.createElement('pre');
    pre.setAttribute('style', 'height: 70vh;width: 100%;overflow: auto;');
    pre.setAttribute('readonly', 'true');
    pre.textContent = decodedText;
    container.appendChild(pre);
  }

  private isJsonText(text: string, fileName: string, contentType: string): boolean {
    const normalizedFileName = (fileName || '').toLowerCase();
    if (normalizedFileName.endsWith('.json') || normalizedFileName.endsWith('.geojson') || contentType.includes('json')) {
      return true;
    }

    const trimmed = text.trim();
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
  }

  private isDelimitedText(text: string, fileName: string, contentType: string): boolean {
    const normalizedFileName = (fileName || '').toLowerCase();
    if (normalizedFileName.endsWith('.csv') || normalizedFileName.endsWith('.tsv')) {
      return true;
    }
    if (contentType.includes('csv') || contentType.includes('tab-separated-values')) {
      return true;
    }

    const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0) || '';
    return [',', '\t', ';', '|'].some((delimiter) => firstLine.includes(delimiter));
  }

  private isXmlText(text: string, fileName: string, contentType: string): boolean {
    const normalizedFileName = (fileName || '').toLowerCase();
    if (normalizedFileName.endsWith('.xml') || normalizedFileName.endsWith('.rdf')) {
      return true;
    }
    if (contentType.includes('xml') || contentType.includes('rdf')) {
      return true;
    }

    return text.trim().startsWith('<');
  }

  private getContainer(): HTMLElement | null {
    return this.iframeBody?.nativeElement || document.getElementById('iframeBody');
  }

  private renderGoogleViewer(): void {
    const container = this.getContainer();
    if (!container) {
      return;
    }

    container.innerHTML = '';
    this.loading = true;

    const src = 'https://docs.google.com/gview?url=' + this.url + '&embedded=true';
    const iframe = document.createElement('iframe');
    iframe.setAttribute('style', 'height: 70vh;width: 80vw;');
    iframe.src = src;

    const interval = setInterval(() => {
      this.loading = true;
      iframe.src = src;
    }, 5000);

    iframe.onload = () => {
      this.loading = false;
      clearInterval(interval);
    };
    iframe.onerror = () => {
      this.loading = false;
      clearInterval(interval);
    };

    container.appendChild(iframe);
  }

  private renderTooLargeMessage(): void {
    this.renderErrorMessage('File size too large to preview, but you can still download it.');
  }

  private renderErrorMessage(message: string): void {
    const container = this.getContainer();
    if (!container) {
      return;
    }
    // C5: build element programmatically — no innerHTML with dynamic content
    const div = document.createElement('div');
    div.style.color = 'red';
    div.style.fontWeight = 'bold';
    div.style.fontSize = '1.2em';
    div.textContent = message;
    container.replaceChildren(div);
  }

  private isGoogleViewerOnlyContent(contentType: string): boolean {
    return contentType.startsWith('image/') || contentType.startsWith('audio/') || contentType.startsWith('video/');
  }

  private isLikelyTextPreview(url: string): boolean {
    const normalized = (url || '').toLowerCase();
    return normalized.includes('csv') || normalized.includes('tsv') || normalized.includes('json') || normalized.includes('txt') || normalized.includes('xml') || normalized.includes('rdf');
  }

  csvToTable(csvText: string): HTMLTableElement {
    const normalizedText = (csvText || '').replace(/\r\n/g, '\n').trim();
    const delimiter = this.detectDelimiter(normalizedText);
    const rows = this.parseDelimitedRows(normalizedText, delimiter);
    const visibleRows = rows.slice(0, this.maxTableRows);
    const table = document.createElement('table');
    table.border = '1';

    visibleRows.forEach((cells, index) => {
      const tr = document.createElement('tr');

      cells.forEach((cell) => {
        const td = document.createElement(index === 0 ? 'th' : 'td');
        td.textContent = cell;
        tr.appendChild(td);
      });

      table.appendChild(tr);
    });

    if (rows.length > this.maxTableRows) {
      const warningRow = document.createElement('tr');
      const warningCell = document.createElement('td');
      warningCell.colSpan = 999;
      warningCell.style.fontWeight = 'bold';
      warningCell.textContent = `Preview limited to first ${this.maxTableRows} rows (${rows.length} total rows).`;
      warningRow.appendChild(warningCell);
      table.appendChild(warningRow);
    }

    return table;
  }

  private detectDelimiter(text: string): string {
    const sampleRows = text.split('\n').filter((line) => line.trim().length > 0).slice(0, 20);
    if (!sampleRows.length) {
      return ',';
    }

    const candidates = [',', '\t', ';', '|'];
    let selected = ',';
    let selectedCount = -1;

    candidates.forEach((candidate) => {
      const count = sampleRows.reduce((accumulator, row) => accumulator + this.countDelimiterOutsideQuotes(row, candidate), 0);
      if (count > selectedCount) {
        selected = candidate;
        selectedCount = count;
      }
    });

    return selected;
  }

  private countDelimiterOutsideQuotes(row: string, delimiter: string): number {
    let inQuotes = false;
    let count = 0;

    for (let index = 0; index < row.length; index++) {
      const character = row[index];
      if (character === '"') {
        const escapedQuote = inQuotes && row[index + 1] === '"';
        if (escapedQuote) {
          index++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (!inQuotes && character === delimiter) {
        count++;
      }
    }

    return count;
  }

  private parseDelimitedRows(text: string, delimiter: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let index = 0; index < text.length; index++) {
      const character = text[index];

      if (character === '"') {
        const escapedQuote = inQuotes && text[index + 1] === '"';
        if (escapedQuote) {
          currentCell += '"';
          index++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (!inQuotes && character === delimiter) {
        currentRow.push(currentCell);
        currentCell = '';
        continue;
      }

      if (!inQuotes && (character === '\n' || character === '\r')) {
        if (character === '\r' && text[index + 1] === '\n') {
          index++;
        }
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        continue;
      }

      currentCell += character;
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }

    return rows;
  }

  private tryFormatXml(xmlText: string): string {
    try {
      const documentNode = new DOMParser().parseFromString(xmlText, 'application/xml');
      if (documentNode.getElementsByTagName('parsererror').length > 0) {
        return xmlText;
      }
      const serialized = new XMLSerializer().serializeToString(documentNode);
      return this.prettyPrintXml(serialized);
    } catch (_error) {
      return xmlText;
    }
  }

  private prettyPrintXml(xml: string): string {
    const normalized = xml.replace(/>\s*</g, '><').replace(/(>)(<)(\/*)/g, '$1\n$2$3');
    const lines = normalized.split('\n');
    let indentation = 0;
    const formatted: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return;
      }

      if (trimmed.startsWith('</')) {
        indentation = Math.max(indentation - 1, 0);
      }

      formatted.push(`${'  '.repeat(indentation)}${trimmed}`);

      if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.includes('</')) {
        indentation++;
      }
    });

    return formatted.join('\n');
  }

  private isPdfContent(url: string, contentType: string, bytes: Uint8Array): boolean {
    const normalizedUrl = (url || '').toLowerCase();
    return contentType.includes('application/pdf') || normalizedUrl.includes('.pdf') || this.isPdfBytes(bytes);
  }

  private isPdfBytes(bytes: Uint8Array): boolean {
    return bytes.length >= 4
      && bytes[0] === 0x25
      && bytes[1] === 0x50
      && bytes[2] === 0x44
      && bytes[3] === 0x46;
  }

  private renderPdfFromBytes(bytes: Uint8Array): void {
    this.renderBlobInIframe(new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' }));
  }

  private renderBlobInIframe(blob: Blob): void {
    const container = this.getContainer();
    if (!container) {
      return;
    }

    this.releaseObjectUrl();
    this.activeObjectUrl = URL.createObjectURL(blob);
    container.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.setAttribute('style', 'height: 70vh;width: 100%;border: 0;');
    iframe.src = this.activeObjectUrl;
    container.appendChild(iframe);
  }

  private releaseObjectUrl(): void {
    if (!this.activeObjectUrl) {
      return;
    }
    URL.revokeObjectURL(this.activeObjectUrl);
    this.activeObjectUrl = null;
  }

  private isHttpStatus(error: unknown, status: number): boolean {
    const maybeError = error as { status?: number } | null;
    return !!maybeError && maybeError.status === status;
  }

}
