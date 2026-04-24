import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml'
})
export class SafeHtmlPipe implements PipeTransform {

  constructor(protected sanitizer: DomSanitizer) {}

  public transform(value: any): any {
    // Datalet HTML comes from the admin-configured DEEP platform (DATALET_URL env variable).
    // It contains <iframe> embeds that Angular's sanitizer would strip.
    // Trust is placed in the DEEP service, not in end-user input.
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }

}
