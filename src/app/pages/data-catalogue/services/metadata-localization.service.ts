import { Injectable } from '@angular/core';
import { DcatDetails } from '../model/dcatdetails';
import { DcatKeyword } from '../model/dcatkeyword';
import { DCATDataset } from '../model/dcatdataset';
import { DCATDistribution } from '../model/dcatdistribution';

@Injectable({
  providedIn: 'root',
})
export class MetadataLocalizationService {

  private static readonly RAW_TITLE_KEY = '__rawTitle';
  private static readonly RAW_DESCRIPTION_KEY = '__rawDescription';
  private static readonly RAW_KEYWORDS_KEY = '__rawKeywords';
  private static readonly LANGUAGE_ALIASES: { [code: string]: string } = {
    sp: 'es',
    gr: 'el',
    eng: 'en',
    ita: 'it',
    fra: 'fr',
    fre: 'fr',
    deu: 'de',
    ger: 'de',
    ell: 'el',
    gre: 'el',
    por: 'pt',
    lit: 'lt',
  };

  applyDatasetLocalization(dataset: DCATDataset, preferredLanguage: string): DCATDataset {
    if (!dataset) {
      return dataset;
    }

    const mutableDataset = dataset as any;
    this.initRawFields(mutableDataset, dataset.title, dataset.description);

    dataset.title = this.pickLocalizedValue(
      dataset.datasetDetails,
      'title',
      preferredLanguage,
      mutableDataset[MetadataLocalizationService.RAW_TITLE_KEY],
    );

    dataset.description = this.pickLocalizedValue(
      dataset.datasetDetails,
      'description',
      preferredLanguage,
      mutableDataset[MetadataLocalizationService.RAW_DESCRIPTION_KEY],
    );
    this.initRawKeywords(mutableDataset, dataset.keywords);
    dataset.keywords = this.pickLocalizedKeywords(
      dataset.keywordDetails,
      preferredLanguage,
      mutableDataset[MetadataLocalizationService.RAW_KEYWORDS_KEY],
    );

    if (Array.isArray(dataset.distributions)) {
      dataset.distributions.forEach((distribution) =>
        this.applyDistributionLocalization(distribution, preferredLanguage));
    }

    return dataset;
  }

  applyDistributionLocalization(distribution: DCATDistribution, preferredLanguage: string): DCATDistribution {
    if (!distribution) {
      return distribution;
    }

    const mutableDistribution = distribution as any;
    this.initRawFields(mutableDistribution, distribution.title, distribution.description);

    distribution.title = this.pickLocalizedValue(
      distribution.distributionDetails,
      'title',
      preferredLanguage,
      mutableDistribution[MetadataLocalizationService.RAW_TITLE_KEY],
    );

    distribution.description = this.pickLocalizedValue(
      distribution.distributionDetails,
      'description',
      preferredLanguage,
      mutableDistribution[MetadataLocalizationService.RAW_DESCRIPTION_KEY],
    );

    return distribution;
  }

  private initRawFields(target: any, title: string, description: string): void {
    if (target[MetadataLocalizationService.RAW_TITLE_KEY] === undefined) {
      target[MetadataLocalizationService.RAW_TITLE_KEY] = title;
    }
    if (target[MetadataLocalizationService.RAW_DESCRIPTION_KEY] === undefined) {
      target[MetadataLocalizationService.RAW_DESCRIPTION_KEY] = description;
    }
  }

  private initRawKeywords(target: any, keywords: string[] | undefined): void {
    if (target[MetadataLocalizationService.RAW_KEYWORDS_KEY] === undefined) {
      target[MetadataLocalizationService.RAW_KEYWORDS_KEY] = Array.isArray(keywords) ? [...keywords] : [];
    }
  }

  private pickLocalizedValue(
    details: DcatDetails[] | undefined,
    field: 'title' | 'description',
    preferredLanguage: string,
    fallbackValue: string,
  ): string {
    if (!Array.isArray(details) || details.length === 0) {
      return fallbackValue || '';
    }

    const candidates = details
      .filter((item) => item && this.hasValue(item[field]))
      .map((item) => ({
        value: String(item[field]).trim(),
        language: this.normalizeLanguage(item.language),
      }));

    if (candidates.length === 0) {
      return fallbackValue || '';
    }

    const preferred = this.normalizeLanguage(preferredLanguage);
    const preferredMatch = candidates.find((candidate) =>
      this.languageContains(candidate.language, preferred));
    if (preferredMatch) {
      return preferredMatch.value;
    }

    const englishMatch = candidates.find((candidate) =>
      this.languageContains(candidate.language, 'en'));
    if (englishMatch) {
      return englishMatch.value;
    }

    return candidates[0].value;
  }

  private pickLocalizedKeywords(
    keywordDetails: DcatKeyword[] | undefined,
    preferredLanguage: string,
    fallbackKeywords: string[] | undefined,
  ): string[] {
    const fallback = this.uniqueStrings(fallbackKeywords || []);
    if (!Array.isArray(keywordDetails) || keywordDetails.length === 0) {
      return fallback;
    }

    const candidates = keywordDetails
      .filter((item) => item && this.hasValue(item.value))
      .map((item) => ({
        value: String(item.value).trim(),
        language: this.normalizeLanguage(item.language || ''),
      }));

    if (candidates.length === 0) {
      return fallback;
    }

    const taggedCandidates = candidates.filter((candidate) => this.hasValue(candidate.language));
    if (taggedCandidates.length === 0) {
      return this.uniqueStrings(candidates.map((candidate) => candidate.value));
    }

    const preferred = this.normalizeLanguage(preferredLanguage);
    const preferredGroup = this.pickLanguageGroup(taggedCandidates, preferred);
    if (preferredGroup.length > 0) {
      return preferredGroup;
    }

    const englishGroup = this.pickLanguageGroup(taggedCandidates, 'en');
    if (englishGroup.length > 0) {
      return englishGroup;
    }

    const firstLanguage = taggedCandidates[0]?.language || '';
    return this.uniqueStrings(
      taggedCandidates
        .filter((candidate) => this.normalizeLanguage(candidate.language) === firstLanguage)
        .map((candidate) => candidate.value),
    );
  }

  private pickLanguageGroup(
    candidates: Array<{ value: string; language: string }>,
    preferredLanguage: string,
  ): string[] {
    return this.uniqueStrings(
      candidates
        .filter((candidate) => this.languageContains(candidate.language, preferredLanguage))
        .map((candidate) => candidate.value),
    );
  }

  private uniqueStrings(values: string[]): string[] {
    const result: string[] = [];
    const seen = new Set<string>();
    (values || []).forEach((value) => {
      const normalizedValue = String(value || '').trim();
      if (!normalizedValue) {
        return;
      }
      if (!seen.has(normalizedValue)) {
        seen.add(normalizedValue);
        result.push(normalizedValue);
      }
    });
    return result;
  }

  private languageContains(candidate: string, target: string): boolean {
    if (!candidate || !target) {
      return false;
    }

    const normalizedCandidate = this.normalizeLanguage(candidate);
    const normalizedTarget = this.normalizeLanguage(target);
    if (!normalizedCandidate || !normalizedTarget) {
      return false;
    }

    const candidatePrimary = this.extractPrimaryLanguageCode(normalizedCandidate);
    const targetPrimary = this.extractPrimaryLanguageCode(normalizedTarget);
    if (candidatePrimary && targetPrimary) {
      if (candidatePrimary.includes(targetPrimary) || targetPrimary.includes(candidatePrimary)) {
        return true;
      }

      // For short language selectors (en/it/fr/...), avoid matching non-primary segments.
      if (targetPrimary.length <= 3) {
        return false;
      }
    }

    return normalizedCandidate.includes(normalizedTarget) || normalizedTarget.includes(normalizedCandidate);
  }

  private normalizeLanguage(language: string): string {
    if (!language) {
      return '';
    }
    const normalized = language.trim().toLowerCase().replace(/_/g, '-');
    return MetadataLocalizationService.LANGUAGE_ALIASES[normalized] || normalized;
  }

  private hasValue(value: unknown): boolean {
    return value !== undefined && value !== null && String(value).trim().length > 0;
  }

  private extractPrimaryLanguageCode(language: string): string {
    if (!language) {
      return '';
    }

    const primary = language.split('-')[0]?.trim().toLowerCase();
    if (!primary) {
      return '';
    }

    return MetadataLocalizationService.LANGUAGE_ALIASES[primary] || primary;
  }
}
