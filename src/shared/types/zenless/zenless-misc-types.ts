import { LangCodeMap } from '../lang-types.ts';

export type ZenlessGlossaryTerm = {
  TermId: number,
  TermKey: string,
  TermText?: string,
  TitleKey: string,
  TitleText?: string,
  DescKey: string,
  DescText?: string,
  SourceKey: string
  SourceText?: string,
}

export type ZenlessMultiLangGlossaryTerm = ZenlessGlossaryTerm & {
  TermTextMap?: LangCodeMap,
  TitleTextMap?: LangCodeMap,
  DescTextMap?: LangCodeMap,
  SourceTextMap?: LangCodeMap,
}
