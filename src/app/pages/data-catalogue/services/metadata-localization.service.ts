import { Injectable } from '@angular/core';
import { DcatDetails } from '../model/dcatdetails';
import { DCATDataset } from '../model/dcatdataset';
import { DCATDistribution } from '../model/dcatdistribution';

@Injectable({
  providedIn: 'root',
})
export class MetadataLocalizationService {

  private static readonly RAW_TITLE_KEY = '__rawTitle';
  private static readonly RAW_DESCRIPTION_KEY = '__rawDescription';
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
