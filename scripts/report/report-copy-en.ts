/**
 * The English half of the AI-visibility report's copy.
 *
 * WHY THIS IS A SEPARATE FILE RATHER THAN TERNARIES INSIDE build-visibility.mts: the Chinese copy is
 * 160 strings interleaved with the logic that computes the numbers, and every one of them is already
 * working. Adding a second language in place would mean editing all 160 in the file that also decides
 * counts, fingerprints and entity rules - so a translation mistake and a measurement mistake would
 * look the same in a diff. Here, a translation mistake can only be a translation mistake.
 *
 * HOW IT IS USED: build-visibility.mts merges this over its own copy when the report language is
 * `en`, so a key that is missing here falls back to Chinese - which the build then REFUSES to write,
 * because it scans every authored string for CJK characters before a file is produced. A missing key
 * is therefore a loud failure rather than a half-English report.
 *
 * WHAT MUST BE PRESERVED IN EVERY VALUE: the {placeholders}. They are substituted from the run data,
 * so a value that drops one prints a sentence with a hole in it, or fails the leftover check.
 *
 * WHAT MUST NOT APPEAR: a "%" character. The report's own rule (assertNoPercent) is that a percentage
 * is a number this measurement cannot support, and it is enforced over the whole copy block.
 */
export const COPY_EN: Record<string, string> = {
  reportName: "AI visibility report",
  footer: "AI visibility report",
  tableItem: "Item",
  tableValue: "Result",

  kSubject: "Company measured",
  kModel: "Model",
  kRunMode: "Collection mode",
  kMeasuredOn: "Date measured",
  kWebSearch: "Web search",
  kRunsPerQuestion: "Runs per question",
  kAnswersFile: "Data file",
  kCompleted: "Completed answers / lines in the file",
  kExcluded: "Excluded lines",
  kTokens: "Total tokens",
  kSearchCalls: "Web-search calls",
  kCitations: "Citation events / distinct domains",
  kGeneratedAt: "Report generated on",
  kHeadline: "Headline figure",
  yes: "yes",
  no: "no",
  notMeasured: "not measured",
  notRun: "not run",

  thTotal: "Total",
  thGroup: "Question group",
  thQuestions: "Questions",
  thRuns: "Completed runs",
  thBrand: "Brand mentions",
  thCoatings: "Category mentions",
  thNo: "No.",
  thId: "Bank id",
  thText: "Question",
  thQuestion: "Question",
  thRun: "Run",
  thExcerpt: "Opening of that answer (verbatim)",
  thDomain: "Domain",
  thCount: "Citation events",
  thWhere: "Appears in",
  thClaim: "Assertion in the answer",
  thSource: "Appears in",
  thHandling: "How this report treats it",
  thField: "Field",
  thMeaning: "Meaning",
  thUsage: "How this report uses it",
  thStage: "Stage",
  thWork: "Suggested work",
  thOutput: "Verifiable output",
  thRun1: "Run 1",
  thRun2: "Run 2",
  thRun3: "Run 3",
  thPurpose: "What this group measures",
  runLabel: "Run {n}",

  sectionBank: "1. What was asked: the bank and its approval record",
  bankLead:
    "Every number in this report comes from the questions below, so the questions come first. This run used the {bankLanguage} bank: {bankQuestions} questions in {bankGroups} groups, in the bank's own taxonomy. The sha256 fingerprint of the question list is {bankFingerprint}. The same fingerprint means the same questions; a different one means two measurements whose numbers cannot be placed side by side.",
  bankFrozen: "{bankFrozenSentence}",
  bankApprovalLine: "{bankApprovalSentence}",
  bankIntakeDrift: "{bankDriftSentence}",
  bankQuestionsTitle: "The bank itself: {bankQuestions} questions, grouped by what each group measures",

  sectionSummary: "2. Executive summary",
  summaryCallout:
    "In one line: across {nonBrandRuns} runs of questions that do not name the brand, {BRAND} is mentioned {nonBrandMentions} times.",
  sectionSummaryConclusions: "Three conclusions",
  summaryReach: "{summaryReachBody}",
  summaryEntity: "{summaryEntityBody}",
  summaryFacts: "{summaryFactsBody}",

  sectionCoverage: "What this measurement covered",
  coverageLead:
    "One measurement, one model, {questionCount} questions, {runsPerQuestion} runs each, {runs} completed answers in total. The groups are not decoration: questions without the brand name measure reach, questions with it measure entity understanding and factual accuracy, and their denominators differ, so the two cannot be added together - which is why the table below reports them separately.",
  coverageNote: "{coverageNoteBody}",

  sectionNotMeasured: "What this measurement did not cover",
  sectionOverview: "3. AI visibility overview",
  overviewLead: "{overviewLeadBody}",
  overviewTotals:
    "Total: across {runs} completed answers the brand is mentioned {brandRuns} times. {promptedRuns} of those runs asked a question that contained the brand name, and in those a mention is close to automatic.",
  overviewPrompted:
    "Removing the questions that name the brand leaves {nonBrandRuns} runs, in which the brand is mentioned {nonBrandMentions} times: {nonBrandMentions} / {nonBrandRuns}. That figure is this report's headline number, because it is closer to whether a stranger asking about the category meets this company.",

  sectionHowToRead: "How to read the results",
  readCounts:
    "Every number is written as a count - how many runs, out of how many. There are no percentages in this report, because a ratio built from {runsPerQuestion} runs turns one run's randomness into a conclusion.",
  readPrompted:
    "A brand mention is close to automatic in the groups whose questions contain the brand name. Those groups show only that the model can tie the name to the company; they say nothing about whether a stranger would meet it.",
  readDenominator:
    "The denominator is always the runs that question actually completed. One missing run makes the denominator one smaller; a question with no completed run reads 'not measured' rather than 0. This run's target was {runsPerQuestion} runs for each of {questionCount} questions.",
  readSameDay:
    "All {runs} answers are observations from a single day, {measuredOn}, in a single measurement, and the model was {model}. A different day, a different model version, or web search switched off can each change the numbers.",

  sectionEntity: "4. Entity identification: what the answers call this company",
  entityLead: "{entityLeadBody}",
  sectionEntityRuns: "One question, and what each run concluded",
  entityRunsLead: "{entityRunsLeadBody}",
  entityFinding: "{entityFindingBody}",
  entityConclusionRule: "{entityConclusionRuleBody}",
  entityConclusionLine: "{entityConclusionLineBody}",

  sectionGroups: "5. Group by group",
  groupsLead:
    "{groupCount} groups measure different things, and any one of them taken alone will be misread: the groups without the brand name understate what the model knows about the company, and the groups with it overstate how a stranger would find it.",

  sectionCompetitors: "6. Competitors: who gets recommended",
  competitorsCallout:
    "Across {nonBrandRuns} runs of questions that do not name the brand, {BRAND} is mentioned {nonBrandMentions} times, and the most-recommended name is {compTopName} ({compTopCount} times).",
  competitorsLead:
    "The table counts each competitor the client named in the intake, again as counts rather than percentages. The first column is the count in questions that do not name the brand - that is the share-of-voice column, because nothing in those questions prompts an answer; the second column is the count across all questions.",
  competitorsBody:
    "How a mention is decided: the competitor counts once when its name appears in the answer text, matched the same way as the brand name (Latin names on word boundaries, CJK names as substrings - see lib/answer-check/rules.ts). The names are the client's own spellings from the intake, so a competitor written as an official name nobody says out loud scores 0, and that 0 is a property of the spelling rather than evidence that the competitor was not recommended.",
  competitorsNote:
    "Only the {compCount} names the client listed are counted. Answers mention other vendors as well; this report does not count them and draws no conclusion about any of them.",
  competitorsNone1:
    "No competitor was measured, so there are no competitor figures to put in a table. This report does not fill the gap with placeholders: a blank cell and a 0 would both be read as a finding.",
  competitorsNone2:
    "The answers do mention many other vendors. That is the body of an answer, not an object of this measurement: they were not counted here, and no judgement is made about any of them.",
  competitorsNone3:
    "For a competitor comparison next time, name 3-5 competitors in the intake's competitors.names and run the same {runsPerQuestion} runs against the same bank; only figures obtained that way can be placed beside this run's numbers.",
  thCompName: "Competitor",
  thCompNonBrand: "In questions without the brand",
  thCompAll: "In all questions",
  thCompGroups: "By group",
  sheetCompetitors: "Competitor mentions",

  sectionSources: "7. Source network: which domains the answers cited",
  sourcesLead:
    "{runs} answers produced {citationEvents} citation events across {distinctDomains} domains (a domain cited twice inside one answer counts once; repeats across answers count separately). By group: {citationsByGroup}. The table lists the top {domainLimit} domains by citation events, and the most-cited is {topDomain} ({topDomainCount} times).",
  sourcesNote:
    "This report judges neither the authority of these domains nor their relationship to the company ({topDomain} is unverified like the rest). The table is a distribution of what the answers cited: not an authority ranking, and not a link-building list.",
  sectionSourcesCaveat: "Three things this table must not be read as",
  sourcesCaveat1:
    "Citations are not influence. A domain appearing often means the answers linked it often; it does not mean the domain is more authoritative, or that the model weights it more heavily.",
  sourcesCaveat2:
    "A domain counts once per answer, and repeats across answers count separately. So this is a distribution of citation events, not a count of distinct sources.",
  sourcesCaveat3:
    "This report did not check whether the client already appears on these domains. That needs the company to supply its list of existing public presences, and this run had no such input.",

  sectionClaims: "8. Assertions in the answers: none of them verified here",
  claimsCallout:
    "Every row below appears in a model's answer, and this report verified none of them. It is not a list of things AI got wrong; it is a list of things to check before repeating them.",
  claimsNote: "{claimsNoteBody}",

  sectionQuotes: "9. Representative extracts from the answers",
  quotesLead:
    "Each extract names the bank id, the run number and the question group, and is taken verbatim from the data file. Only Markdown bold and heading marks were removed; no wording and no punctuation was changed.",
  quoteQuestion: "Question: ",
  quoteAnswer: "Answer extract: ",

  sectionAdvice: "10. Actions",
  adviceLead:
    "The items below are read directly out of this measurement rather than from a template, and none of them promises an outcome: this report measured no competitor, and it did not measure what happens after content is published.",
  adviceProblem: "Problem: ",
  adviceAction: "Suggested action: ",
  adviceDeliverable: "Deliverable: ",
  adviceAcceptance: "Acceptance: ",

  sectionPlan: "Retest plan",
  planNote:
    "This is a suggested rhythm, not a commitment. A retest answers whether the per-question counts changed under the same bank and the same model; it cannot answer whether the work produced a mention. Between two retests, do not compare an overall rise - look at which questions went from 0 to 1. A retest must use the same bank (fingerprint {bankFingerprint}), or the numbers cannot be compared.",

  sectionNoScore: "Appendix: why this report has no overall score",
  noScoreLead:
    "The external deliverable whose structure this report follows opens with a weighted score out of 100. This report gives no score and no percentages. There are four reasons.",
  noScore1:
    "{runsPerQuestion} runs cannot support a ratio. Answers to the same question range from {minAnswerChars} to {maxAnswerChars} characters, so the variation in a single run would be read as a score.",
  noScore2:
    "A score needs weights, and this data offers no basis for calibrating them. That external file's input was 400 synthesised records built to a preset rule, where weights can be assigned by design; this run is {runs} records (collection mode {runModeLabel}) with no second set of data to calibrate against.",
  noScore3:
    "A score would be compared as though it were a conclusion, and this report measured no competitor. A score with nothing to compare it against is read as 'good' or 'bad', and neither reading is supported.",
  noScore4:
    "What this report provides is counts and the answers themselves, so anyone can recompute them: every run of every question, the domains each one cited and the full answer are all in the data file.",

  sectionMethodAppendix: "Appendix: sampling design, method and limits",
  sectionSampleDesign: "Sample design",
  sampleDesignLead:
    "{questionCount} questions in {groupCount} groups, with the same questions put to the same model {runsPerQuestion} times each. Bank fingerprint {bankFingerprint}; the groups are the bank's own taxonomy, not a grouping decided afterwards.",

  sectionGeneration: "How this report was produced",
  sectionCoding: "How each marked field is decided",
  sectionReplication: "Replicating this measurement",
  replication1:
    "The same {questionCount} questions, the same model version, {runsPerQuestion} runs each, {webSearchSentence}, on one day if possible, every run in a fresh session.",
  replication2:
    "Record the model version, the date, whether search was on, the raw answers and the domains they cited. Record failed lines separately: they are not zero mentions, they are not measured.",
  replication3:
    "Compare two measurements question by question rather than as an overall change. Raising the number of runs makes it a new measurement: the denominator changes, and the two sets of figures cannot be placed side by side.",
  sectionQuestions: "Appendix: the full bank and its per-run marks",
  questionsLead: "{questionsLeadBody}",

  sectionProvenance: "Sources and verification record",

  sheetOverview: "Overview",
  sheetQuestions: "Counts by question",
  sheetGroups: "Totals by group",
  sheetBank: "Bank and approval",
  sheetDomains: "Cited domains",
  sheetClaims: "Assertions",
  sheetQuotes: "Answer extracts",
  sheetMeta: "Metadata",
  sheetAbout: "About and limits",

  figGroups:
    "Figure 1 | By group: brand mentions per group of questions. Labels are counts, n = completed runs in each group ({groupRuns}). Denominators differ, so each label carries its own.",
  figGroupsAxis: "Mentions (denominators differ by group)",
  figMentions:
    "Figure 2 | By question: how many runs mentioned the brand, per question. Labels are counts, n = completed runs per question ({runsPerQuestion}); the axis runs from 0 to {runsPerQuestion}.",
  figMentionsAxis: "Mentions (of {runsPerQuestion} runs per question)",
  figEntity:
    "Figure 3 | Name and entity: across {entityTotalRuns} runs of the {entityQuestions} questions that name a short form, alias or former name, whether the answer cited the client's own domain ({BRAND}). Labels are counts, n = {entityTotalRuns}. The classification rule is printed below the figure and in the text, and every run's extract is in this section.",
  figEntitySame: "Cited the client's own domain: {entitySameConclusion}",
  figEntityNotSame: "Did not cite it: {notSameRuns}",
  figEntityN: "n = {entityTotalRuns} (all runs of the {entityQuestions} name questions)",
  figSources:
    "Figure 4 | Sources: the {domainLimit} most-cited domains. Labels are counts (citation events), n = {citationEvents} citation events across {distinctDomains} domains; a further {otherDomains} domains account for {otherEvents} events and are not listed. The order is citation count, not influence.",
  figSourcesAxis: "Citation events",
};
