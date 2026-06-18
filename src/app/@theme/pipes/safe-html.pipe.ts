import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml'
})
export class SafeHtmlPipe implements PipeTransform {

  constructor(protected sanitizer: DomSanitizer) {}

  public transform(value: any): any {
    // Produces a SafeHtml for binding to a SANDBOXED iframe's [srcdoc] (see
    // show-datalets / datalet-dialog). The sandbox (no allow-same-origin) isolates
    // the markup from the app, so trusting it here cannot expose the app or token.
    // Do NOT use this pipe with [innerHTML] on dynamic/untrusted content.
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }

}
