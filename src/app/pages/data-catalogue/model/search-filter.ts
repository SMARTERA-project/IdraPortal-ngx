export class SearchFilter {
    field: string='ALL';
    value: string="";

    constructor(field?:string,value?:string){
        this.field=(field!=undefined)?field:'ALL';
        this.value=(value!=undefined)?value:"";
    }

    // Multiple values of a filter are comma-separated; a comma inside a value (e.g. the keyword
    // "boschi, ecosistemi") is escaped as "\," so the backend keeps it as a single value.
    static splitValues(value: string): string[] {
        return (value || '').split(/(?<!\\),/).filter(x => x != '').map(x => x.replace(/\\,/g, ','));
    }

    static joinValues(values: string[]): string {
        return values.map(x => x.replace(/,/g, '\\,')).join(',');
    }
}
