# Hadith data only through a provider boundary and a normalized model

Hadith sources differ in what they offer (Arabic text, translations, narrators, grades, chapters, topics, search), so all Hadith data enters through a `HadithProvider` service layer that validates responses with Zod and maps them to Athar's normalized `Hadith` model; UI and features never depend on a provider's response format. The initial provider is the fawazahmed0 Hadith API on jsDelivr that the old app used, configured by an environment variable, so a provider can be swapped or added without touching the UI.
