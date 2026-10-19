// The referral form's questions, choices and the centers' contact details.
// Every question names its key and every choice its code exactly as the worker's contract has them
// (CLAUDE.md, "The referral form and the attorney portal"); the words on screen can change freely here.
// The owner's decisions are coded W1 to W30 there. Static content only: nothing an attorney types is kept here.
(function () {
  'use strict';

  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

  var CONFIG = {
    worker: local ? 'http://localhost:8789' : 'https://riac-referrals.djackson-314.workers.dev',
    // Cloudflare's published test key (always passes) until the owner makes the real widget.
    turnstileKey: local ? '1x00000000000000000000AA' : '1x00000000000000000000AA',
    maxReferralBytes: 81920,
    draftKey: 'riac-referral-draft'
  };

  // The centers. Their details are a copy of contact.html: if that page changes, change this too (W7 1).
  var CENTRES = {
    R1: { name: 'Western New York RIAC (Region 1)', short: 'Western New York RIAC', colour: 'var(--r1)', blocks: [
      { org: 'Legal Aid Bureau of Buffalo', address: '290 Main Street, Suite 400, Buffalo, NY 14202', phone: '(716) 853-9555', tel: '+17168539555', ext: 'ext. 269', email: 'sfeal@labbuffalo.org' }] },
    R2: { name: 'Central New York RIAC (Region 2)', short: 'Central New York RIAC', colour: 'var(--r2)', blocks: [
      { address: '109 South Warren Street, Suite 220, Syracuse, NY 13202', phone: '(315) 898-2593', tel: '+13158982593', email: 'RIAC2@ocbaacp.org' }] },
    R3: { name: 'Northern New York RIAC (Region 3)', short: 'Northern New York RIAC', colour: 'var(--r3)', blocks: [
      { address: '112 State Street, Suite 900, Albany, NY 12207', phone: '(518) 447-7708', tel: '+15184477708', email: 'ercan.kilic@albanycountyny.gov' }] },
    R4: { name: 'Hudson Valley RIAC (Region 4)', short: 'Hudson Valley RIAC', colour: 'var(--r4)', blocks: [
      { org: 'Legal Aid Society of Westchester County', address: '50 Grand Street, White Plains, NY 10601', phone: '(914) 286-3408', tel: '+19142863408', email: 'rhorne@laswest.org' }] },
    R5: { name: 'New York City: the Immigrant Defense Project (Region 5)', short: 'the Immigrant Defense Project', colour: 'var(--r5)', idp: true, blocks: [
      { who: 'Padilla Support Center', org: 'Immigrant Defense Project', website: 'https://www.immigrantdefenseproject.org/advice/', websiteText: 'immigrantdefenseproject.org/advice', email: 'attorneyadvice@immdefense.org' }] },
    R6: { name: 'Long Island RIAC (Region 6)', short: 'Long Island RIAC', colour: 'var(--r6)', blocks: [
      { who: 'Nassau County', org: 'Attn: Long Island RIAC', address: '40 Main Street, 3rd Floor, Hempstead, NY 11550-4042', phone: '(516) 560-6474', tel: '+15165606474', email: 'SuffolkLIRIAC@nclas.org' },
      { who: 'Suffolk County', org: 'Attn: Long Island RIAC', address: 'Cohalan Court Complex, 400 Carleton Avenue, 4th Floor, Central Islip, NY 11722-4545', phone: '(631) 853-7807', tel: '+16318537807', email: 'LIRIAC@sclas.org' }] }
  };

  var PDFS = [
    { href: 'intake-forms/criminal-intake-form.pdf', text: 'Criminal Intake Form (PDF)' },
    { href: 'intake-forms/non-criminal-intake-form.pdf', text: 'Non-Criminal Intake Form (PDF)' }
  ];

  // W32 1: the paper criminal form's "Before you receive RIAC advice", short (the owner's words), each with its
  // advisory's symbol from the Practice Advisories page and a link straight to the PDF. Shown above Send for the case
  // types the paper criminal form covers. If an advisory's file or title changes on advisories.html, change it here.
  var STEPS_PDF = { doc: 'advisories/client-not-born-in-the-us.pdf', title: 'Steps You Must Take If Your Client Was Not Born In The U.S.' };
  var ADVICE_FIRST = {
    caseTypes: ['criminal', 'vop', 'appeal', 'post-conviction'],
    items: [
      { symbol: 'protection', bold: 'Orders of protection', text: ' require immediate steps by you.',
        doc: 'advisories/domestic-orders-of-protection.pdf', title: 'Orders Of Protection: Steps You Must Take For Foreign-Born Clients' },
      { symbol: 'steps', bold: 'ICE detainer, or an ICE arrest likely?', text: ' Review our advisory immediately.', doc: STEPS_PDF.doc, title: STEPS_PDF.title },
      { symbol: 'stop', bold: 'No plea or diversion', text: ' without RIAC advice.',
        doc: 'advisories/no-diversion-or-up-front-pleas-without-riac-advice.pdf', title: 'No Diversion Or Up-Front Pleas Without RIAC Advice' },
      { symbol: 'acd', bold: 'No ACD', text: ' until you have gone through the ACD advisory with your client.',
        doc: 'advisories/info-for-attorneys-and-clients-regarding-acds.pdf', title: 'Adjournments In Contemplation Of Dismissal (ACDs)' },
      { symbol: 'interpreter', bold: 'No use of court interpreters for client conversations:', text: ' it’s not privileged!',
        doc: 'advisories/court-interpreters-cannot-be-used-outside-court.pdf', title: 'Court Interpreters Cannot Be Used Outside Of Court' },
      { symbol: 'individual', bold: 'Your client can refuse to speak with ICE,', text: ' even to confirm their name. Tell them.', doc: STEPS_PDF.doc, title: STEPS_PDF.title },
      { symbol: 'consult', bold: 'We advise you, not your client:', text: ' please do not ask them to contact RIAC.' }
    ]
  };

  // The nine steps (W11 1). Step 6 is named for the case type.
  var CASE_TYPES = [
    { code: 'criminal', label: 'Criminal Case', step: 'Criminal Case', heading: 'Criminal case' },
    { code: 'vop', label: 'Violation of Probation', step: 'Probation Violation', heading: 'Violation of probation' },
    { code: 'family', label: 'Family Court / Divorce', step: 'Family Court', heading: 'Family court or divorce' },
    { code: 'appeal', label: 'Appeal', step: 'Appeal', heading: 'Appeal' },
    { code: 'post-conviction', label: 'Post-Conviction Relief / Post-Disposition', step: 'Post-Conviction', heading: 'Post-conviction relief' },
    { code: 'removal', label: 'Assistance With Removal Defense / USCIS', step: 'Removal', heading: 'Removal defense or USCIS' }
  ];

  // Choice lists ---------------------------------------------------------------------------------------------------

  function C(code, label) { return { code: code, label: label }; }
  var YNU = [C('yes', 'Yes'), C('no', 'No'), C('unknown', 'Unknown')];   // W21: a plain "Unknown"
  var LIST_NOTE = 'Please provide any information relevant to these questions';

  var CHOICES = {
    officeType: [C('public-defender', 'NY Public Defender / Institutional Provider'), C('assigned-counsel', 'NY Assigned Counsel / 18(b)'),
      C('federal-defender', 'Federal Defender / CJA Panel Attorney'), C('non-profit', 'Non-Profit Legal Organization'),
      C('private', 'Privately Retained Attorney or Law Firm'), C('none', 'None of These')],
    custody: [C('at-liberty', 'At liberty with no restrictions'), C('ror', 'Released on Recognizance'), C('bail-released', 'Bail - Released'),
      C('supervised', 'Released under supervision'), C('bail-detained', 'Bail - Detained (Criminal)'), C('incarcerated', 'Incarcerated (Criminal)'),
      C('ice-detained', 'Detained - Immigration Custody')],
    protectionOrders: [C('op-was-in-place', 'OP against client was already in place'), C('op-now-in-place', 'OP against client now in place'),
      C('op-violation', 'Violation of an OP alleged/possible'), C('op-for-client', 'Order of protection FOR client')],
    aliases: [C('none', 'No - none known'), C('yes', 'Yes - details below')],
    english: [C('read-write', 'Read & Write'), C('spoken-only', 'Spoken Only'), C('interpreter', 'Interpretation Needed')],
    screeningClient: [C('prior-arrests', 'Has prior arrests or criminal history'), C('drugs-ever', 'Has ever used drugs (inc. marijuana)'),
      C('drugs-now', 'Currently uses drugs (inc. marijuana)'), C('mental-health', 'Has mental health concerns'), C('alcohol', 'Alcohol problem')],
    screeningIce: [C('in-proceedings', 'Is in immigration court proceedings'), C('removal-order', 'Has prior removal (deportation) order'),
      C('deported', 'Physically deported before'), C('ice-arrest', 'Has ever been arrested by ICE'), C('ice-aware', 'ICE may know of client - but never arrested')],
    screeningImmigration: [C('has-imm-attorney', 'Has an immigration attorney'), C('does-not-care', 'Does not care about being deported'),
      C('needs-travel', 'Needs to travel before this case is resolved'), C('fears-persecution', 'Fears persecution or torture'),
      C('dv-victim', 'May be a DV victim'), C('trafficking-victim', 'May be a trafficking victim'), C('crime-victim', 'Victim of a serious crime'),
      C('help-law-enforcement', 'Would help law enforcement')],
    family: [C('parent-usc', 'Parent = US citizen'), C('parent-lpr', 'Parent = Green Card holder'), C('spouse-usc', 'Spouse = US citizen'),
      C('spouse-lpr', 'Spouse = Green Card holder'), C('child-under21-usc', 'Child = Under 21 & US citizen'), C('child-under21-lpr', 'Child = Under 21 & Green Card holder'),
      C('child-over21-usc', 'Child = Over 21 & US citizen'), C('child-over21-lpr', 'Child = Over 21 & Green Card holder')],
    incident: [C('domestic', 'Domestic relationship to complainant'), C('child-victim', 'Victim is a child'), C('child-present', 'A child was present'),
      C('loss-10k', 'Alleged loss of $10k or more'), C('gang', 'Possible gang involvement'), C('drugs', 'Drugs involved in any way')],
    adviceBefore: [C('yes-riac', 'Yes - From RIAC'), C('yes-other', 'Yes - From Other Source'), C('no', 'No'), C('unclear', 'Unclear')],
    matterTypes: [C('abuse-neglect', 'Abuse & Neglect'), C('family-offense', 'Family Offense'), C('custody', 'Custody'),
      C('family-other', 'Family Court (Other)'), C('divorce', 'Divorce')],
    yesNoUnsure: [C('yes', 'Yes'), C('no', 'No'), C('unsure', 'Unsure')],
    screeningMarriage: [C('marriage-fraud', 'Marriage fraud implicated? (whether or not plead)'), C('breakdown-6m', 'Irretrievable breakdown for 6+ months'),
      C('cruel-5y', 'Cruel and inhuman treatment within 5 years'), C('abandonment-1y', 'Abandonment for 1+ year'), C('imprisonment-3y', 'Imprisonment for 3+ years'),
      C('adultery', 'Adultery'), C('after-separation-agreement', 'Divorce after a legal separation agreement'),
      C('after-separation-judgment', 'Divorce after a judgment of separation')],
    screeningChildren: [C('custody-uncontested', 'Custody - uncontested'), C('custody-contested', 'Custody - contested'),
      C('travel-with-children', 'Travel abroad with children'), C('prior-cps', 'Prior CPS involvement'), C('current-cps', 'Current CPS case'),
      C('mistreatment-less-than-an', 'Mistreatment of child LESS THAN abuse & neglect')],
    screeningMoney: [C('child-support', 'Child support in issue'), C('spousal-support', 'Spousal support in issue'), C('marital-property', 'Marital property in issue')],
    rapComplete: [C('yes', 'Yes - including out of state'), C('no', 'No - there is more history'), C('unsure', 'Unsure')],
    roles: [C('co-defendant', 'Co-defendant'), C('complainant', 'Complainant or victim'), C('witness', 'Witness'), C('family', 'Family member'), C('other', 'Other person named')],
    others: [C('yes', 'Yes'), C('no', 'No'), C('not-known', 'Not known yet')]
  };

  // Question builders ---------------------------------------------------------------------------------------------
  // type: name (100) | short (200) | email | tel | date | long (6,000) | note (1,000) | radio | ticks | check | search
  // guidance: shown inside a box that can hold words (W16, W17): { eg, text } or a string; html only from this file.
  // desc: shown between the question and its answer, for a date or a choice, or a list kept outside (W25).
  function Q(key, label, type, o) { o = o || {}; o.key = key; o.label = label; o.type = type; return o; }
  function has(A, key, code) { var v = A[key]; return Array.isArray(v) ? v.indexOf(code) !== -1 : v === code; }
  function ticks(key, label, choices, o) {
    o = o || {}; o.choices = choices; o.help = o.help || 'Select any which may apply'; o.unknownNote = LIST_NOTE;
    return Q(key, label, 'ticks', o);
  }

  var ALLEGATIONS = { eg: 'e.g. "Client alleged to have slapped complainant, his girlfriend. She is alleged to have sustained a nose bleed and minor bruising"',
    html: 'Please summarize the <u>ALLEGATIONS</u> at their worst - not what actually happened / can be proven' };

  var CRIMINAL = function (post) {
    return [
      Q('criminal.allegations', 'Attorney’s Summary of Misconduct Allegations', 'long', { guidance: ALLEGATIONS, limitNote: true }),
      Q('criminal.offer', 'Existing Offer Or Likely Disposition', 'long', { limitNote: !post, guidance: post
        ? { eg: 'e.g. "DA will consent to vacate and allow a re-plea to disorderly conduct"; "client’s goal is a resentence of 364 days"',
            text: 'Please record (1) any existing or likely offer if the conviction is vacated or the sentence changed and (2) your client’s current objectives. (Even your best guess is very helpful information.)' }
        : { eg: 'e.g. "Take it to trial unless they offer x"; "client would probably accept y type of disposition"',
            text: 'Please record (1) any existing or likely offer to dispose of this case and (2) your client’s current objectives. (Even your best guess is very helpful information.)' } }),
      Q('criminal.offenceDate', 'Date Of The Alleged Offence Or Misconduct (i.e. not simply arrest date)', 'long', { guidance:
        { eg: 'e.g. "August 2, 2026"; "between January and March 2026"', text: 'Please provide as much detail as possible if this is unclear (many immigration consequences depend on commission date)' } }),
      ticks('criminal.screeningIncident', 'Screening - The Incident', CHOICES.incident, { required: true, help: 'Select any which apply' }),
      Q('criminal.details', 'Criminal Case Info - Details & Explanations for Screening Questions (Include Any Other Important Info Here)', 'long', { copy: 'Criminal case: details and explanations' })
    ];
  };

  var APPEAL = [
    Q('appeal.adviceBefore', 'Did The Client Receive Formal Immigration Advice Before Disposition?', 'radio', { choices: CHOICES.adviceBefore, cols: 2,
      desc: 'Choose "Unclear" if you asked and could not establish it — that is more useful to us than leaving this blank.' }),
    Q('appeal.adviceDetails', 'Details Of Immigration Advice Received By Client', 'long', {
      show: function (A) { return has(A, 'appeal.adviceBefore', 'yes-riac') || has(A, 'appeal.adviceBefore', 'yes-other'); },
      guidance: { eg: 'e.g. "Defense counsel told client at the plea that it could affect immigration; client did not ask"',
        text: 'Please include (1) what the client was advised, (2) at what point in the proceedings this advice was given and (3) whether your client affirmatively asked counsel about immigration' } }),
    // W22: under No or Unclear a notes box, sent in the same key.
    Q('appeal.adviceDetails', 'Please provide any information relevant to whether your client received immigration advice before the disposition', 'long', {
      alias: true, show: function (A) { return has(A, 'appeal.adviceBefore', 'no') || has(A, 'appeal.adviceBefore', 'unclear'); } }),
    Q('appeal.disposition', 'Details Of The Disposition', 'long', { guidance: { eg: 'e.g. "Pled guilty to PL 120.00(1) Assault 3rd on May 4, 2026; sentenced to 3 years probation"' } }),
    { type: 'para', desc: 'You can attach a copy of any immigration advice your client received, and any relevant transcripts (e.g. the plea colloquy), at step 8, Documents.' }
  ];

  var SECTIONS = {
    criminal: CRIMINAL(false),
    'post-conviction': [{ type: 'subhead', text: 'The case' }].concat(CRIMINAL(true), [{ type: 'subhead', text: 'The conviction and the advice' }], APPEAL),
    appeal: APPEAL,
    vop: [
      Q('vop.underlyingAdvised', 'Did RIAC Advise On The Underlying Criminal Case?', 'radio', { choices: YNU, inline: true }),
      Q('vop.underlyingCaseNumber', 'RIAC Case Number For The Underlying Case', 'short', { guidance: 'If you know it',
        show: function (A) { return has(A, 'vop.underlyingAdvised', 'yes'); } }),
      // W20: under No or Unknown, the owner's header over a notes box.
      Q('vop.underlyingAdvisedUnknownWhy', 'Please provide any information relevant to whether your client received immigration advice prior to the underlying conviction', 'note', {
        show: function (A) { return has(A, 'vop.underlyingAdvised', 'no') || has(A, 'vop.underlyingAdvised', 'unknown'); } }),
      Q('vop.underlyingConvictions', 'Statute And Subsection Of <u>ALL</u> Convictions', 'long', { labelHtml: true, guidance: { eg: 'e.g. "PL 120.00(1) Assault 3rd"; "VTL 1192(3) DWI"' } }),
      Q('vop.originalSentence', 'Original Sentence', 'long', { guidance: { eg: 'e.g. "3 years probation"; "6 months jail and 5 years probation"' } }),
      Q('vop.allegations', 'Current Allegations', 'long', { guidance: ALLEGATIONS }),
      Q('vop.parallelCharge', 'Is There A Parallel Criminal Charge?', 'radio', { choices: YNU, inline: true,
        unknownNote: 'Please provide any information relevant to whether there is a parallel criminal charge' }),
      Q('vop.parallelChargeDetails', 'Details Of The Parallel Criminal Charge', 'note', { guidance: { eg: 'e.g. "Petit Larceny, arrested May 3, 2026; pending in Syracuse City Court"' },
        show: function (A) { return has(A, 'vop.parallelCharge', 'yes'); } })
    ],
    family: [
      ticks('family.matterTypes', 'Family Court / Divorce - Type Of Matter', CHOICES.matterTypes, { help: 'Select any which apply', noApart: true }),
      Q('family.description', 'Case Description - INCLUDING Any Misconduct Which Could Be Alleged Against Your Client', 'long', { guidance: {
        eg: 'e.g. "Accused of disciplining child 5-10 times with a paddle, resulting in red marks"; "wants to divorce spouse (who sponsored her green card). DV allegations from both sides likely."',
        text: 'Please provide an overview of what your client is facing / wants to accomplish' } }),
      Q('family.offer', 'Offers & Likely Outcome / Your Client’s Objectives', 'long', { guidance: {
        eg: 'e.g. "Petitioner would withdraw if client consents to a one-year order of protection"; "client wants joint custody and will not admit to neglect"',
        text: 'Please record (1) any existing or likely offer to resolve this case and (2) your client’s current objectives. (Even your best guess is very helpful information.)' } }),
      Q('family.children', '(If Applicable) - Client’s Children - Immigration Details', 'long', {
        descList: [['For each child, please note:', ['the child’s date of birth AND country of birth', 'whether they are the biological or adopted children of your client and their spouse']],
          ['If a child was not born in the U.S., please also include:', ['their current immigration status', 'when they received it']]],
        guidance: { eg: 'e.g. "Maria, born March 3, 2015 in Mexico; biological child of client and spouse; green card since 2019"' } }),
      Q('family.marriage', '(If Applicable) Client’s Marriage - Date, Place And Any Unusual Circumstances', 'long', { guidance: {
        eg: 'e.g. "Married June 12, 2018 at the Onondaga County Clerk’s Office; religious ceremony in Pakistan in 2017, never registered"',
        text: 'Please include the date and physical location the marriage was solemnized, and highlight any less common situation, such as an arranged marriage, a religious or customary marriage NOT registered with civil authorities, or a possibly bigamous one' } }),
      Q('family.spouseSponsored', 'Did The Spouse Sponsor The Client’s Immigration Status?', 'radio', { choices: CHOICES.yesNoUnsure, inline: true }),
      Q('family.affidavitOfSupport', 'Did The Spouse File An Affidavit Of Support?', 'radio', { choices: CHOICES.yesNoUnsure, inline: true }),
      Q('family.spouseStatus', 'Spouse’s Immigration Status And When Received', 'note', { guidance: { eg: 'e.g. "U.S. citizen since 2012"; "green card since 2016"' } }),
      ticks('family.screeningMarriage', 'Screening - Marriage Or Divorce', CHOICES.screeningMarriage, { required: true,
        show: function (A) { return has(A, 'family.matterTypes', 'divorce'); } }),
      ticks('family.screeningChildren', 'Screening - Children And Custody', CHOICES.screeningChildren),
      ticks('family.screeningMoney', 'Screening - Money And Support', CHOICES.screeningMoney, {
        show: function (A) { return has(A, 'family.matterTypes', 'divorce') || has(A, 'family.matterTypes', 'family-other') || has(A, 'family.matterTypes', 'custody'); } }),
      Q('family.details', 'Family Court/Divorce - Details & Explanations for Screening Questions (Include Any Other Important Info Here)', 'long', { copy: 'Family court: details and explanations' })
    ],
    removal: []
  };

  // Steps 2 to 5 -------------------------------------------------------------------------------------------------

  function isOffice(A) { return ['public-defender', 'assigned-counsel', 'federal-defender'].indexOf(A['attorney.officeType']) !== -1; }

  var ABOUT = [
    { type: 'pair', items: [Q('attorney.firstName', 'Attorney’s first name', 'name', { required: true }),
      Q('attorney.lastName', 'Attorney’s last name', 'name', { required: true })] },
    { type: 'pair', items: [Q('attorney.email', 'Attorney Email', 'email', { required: true }), Q('attorney.phone', 'Attorney Phone', 'tel')] },
    Q('attorney.officeType', 'Your Office Type', 'radio', { choices: CHOICES.officeType, cols: 2, required: true }),
    Q('attorney.office', 'Attorney’s Office / Affiliation', 'search', { list: 'offices', guidance: 'Type part of the name to find it', show: isOffice }),
    Q('attorney.officeNotListed', 'Office Not Listed?', 'check', { show: function (A) { return ['public-defender', 'assigned-counsel'].indexOf(A['attorney.officeType']) !== -1; } }),
    Q('attorney.officeDetails', 'If Your Office Was Not Listed, Enter Office Details Here', 'note', {
      show: function (A) { return (A['attorney.officeNotListed'] === true && ['public-defender', 'assigned-counsel'].indexOf(A['attorney.officeType']) !== -1) || ['none', 'non-profit'].indexOf(A['attorney.officeType']) !== -1; } })
  ];

  var COURT = [
    Q('case.caseType', 'Case Type', 'radio', { choices: CASE_TYPES.map(function (t) { return C(t.code, t.label); }), cols: 2, required: true }),
    Q('case.urgentBy', 'If this case is urgent, please state when advice is needed by (leave blank otherwise):', 'date', { copy: 'Advice needed by' }),
    Q('court.name', 'Court', 'search', { list: 'courts', way: 'questions', show: function (A, X) { return !!X.county && A['court.notListed'] !== true; } }),
    Q('court.notListed', 'Court Not Listed / Non-NY Court?', 'check', { way: 'questions', show: function (A, X) { return !!X.county; } }),
    Q('court.notListedDetails', 'Court Not Listed - Details', 'note', { required: true, way: 'questions',
      show: function (A, X) { return A['court.notListed'] === true || !X.county; } }),
    { type: 'pair', way: 'questions', items: [Q('court.docket', 'Docket No.', 'short'), Q('court.nextDate', 'Next Court Date', 'date')] },
    Q('court.iceInvolvement', '<strong>ICE INVOLVEMENT:</strong> Select if (1) you are aware of an ICE detainer, or (2) you know of ANY ICE involvement with this case / your client', 'check', { long: true, labelHtml: true, way: 'questions', copy: 'ICE involvement' }),
    Q('court.protectionOrder', 'Does This Case Involve An Order Of Protection In Any Way?', 'radio', { choices: YNU, inline: true, required: true, way: 'questions',
      unknownNote: 'Please provide any information relevant to whether this case involves an order of protection' }),
    ticks('court.protectionOrders', 'Screening - Orders Of Protection', CHOICES.protectionOrders, { help: 'Select any which apply', way: 'questions',
      show: function (A) { return has(A, 'court.protectionOrder', 'yes'); } }),
    Q('court.custody', 'Client’s Current Custody Status', 'radio', { choices: CHOICES.custody, cols: 2, required: true, way: 'questions' }),
    Q('court.details', 'Court And Case - Details & Explanations for Screening Questions (Include Any Other Important Info Here)', 'long', { way: 'questions', copy: 'Court and case: details and explanations' })
  ];

  var CLIENT = [
    { type: 'pair', items: [Q('client.firstName', 'Client First Name', 'name', { required: true, guidance: 'First name only. If in doubt, put a name in the next box.' }),
      Q('client.lastName', 'Client Middle & Last Names', 'name', { required: true })] },   // W19
    Q('client.dob', 'Client DoB', 'date', { desc: 'If unknown, please leave blank.' }),
    Q('client.aliases', 'Any Known Aliases, Or Variations To The Name Or Date Of Birth?', 'radio', { choices: CHOICES.aliases, inline: true, required: true }),
    Q('client.aliasDetails', 'Details Of Known Aliases, Or Variations To The Name Or Date Of Birth', 'note', { show: function (A) { return has(A, 'client.aliases', 'yes'); } }),
    { type: 'pair', way: 'questions', items: [Q('client.countryOfBirth', 'Client’s Country of Birth', 'short'), Q('client.language', 'Client’s Primary Language', 'short')] },
    Q('client.english', 'Client’s Level Of English', 'radio', { choices: CHOICES.english, inline: true, way: 'questions' })
  ];

  var STATUS = { eg: 'e.g. illegal entry, refugee, green card, F-1 student', text: '(work permits need a code - e.g. C08)' };
  var ESTIMATE = 'If client does not know exactly, please let us know it is an estimate';
  var IMMIGRATION = [
    { type: 'pair', items: [Q('client.entryStatus', 'Client’s Immigration Status at INITIAL Entry To The U.S.', 'short', { guidance: STATUS }),
      Q('client.entryDate', 'Date of Client’s INITIAL Entry To The U.S.', 'short', { guidance: ESTIMATE })] },
    { type: 'pair', items: [Q('client.currentStatus', 'Client’s CURRENT Immigration Status', 'short', { guidance: STATUS }),
      Q('client.currentStatusDate', 'Date of CURRENT Immigration Status', 'short', { guidance: ESTIMATE })] },
    { type: 'pair', items: [Q('client.aNumber', 'Client’s A Number', 'short', { guidance: { html: 'A <b>9 digit</b> number which appears on most immigration paperwork <b>(not a 10 digit SSN)</b>' } }),
      Q('client.pendingApplications', 'Any Pending Immigration Application(s)?', 'short', { guidance: { eg: 'e.g. "Green Card - filed in January 2026"; "N400 will be filed next month"' } })] },
    ticks('client.screeningClient', 'Screening - Information About The Client', CHOICES.screeningClient, { required: true }),
    ticks('client.screeningIce', 'Screening - Any Prior Involvement With ICE Enforcement?', CHOICES.screeningIce, { required: true }),
    ticks('client.screeningImmigration', 'Screening - Immigration Questions', CHOICES.screeningImmigration, { required: true }),
    Q('client.immigrationAttorney', 'Client’s Immigration Attorney - Details', 'note', { show: function (A) { return has(A, 'client.screeningImmigration', 'has-imm-attorney'); } }),
    Q('client.familyAny', 'Does Client Have Any US Citizen / Green Card Family Members?', 'radio', { choices: YNU, inline: true, required: true,
      unknownNote: 'Please provide any information relevant to whether your client has US citizen or green card family members' }),
    ticks('client.family', 'Client’s Family In The United States', CHOICES.family, { required: true, show: function (A) { return has(A, 'client.familyAny', 'yes'); } }),
    Q('client.details', 'Client Info - Details & Explanations for Screening Questions (Include Any Other Important Info Here)', 'long', { copy: 'Client: details and explanations' })
  ];

  // Documents (W28): names and descriptions from the paper criminal intake form.
  var DOCS = {
    'completed-intake-form': { name: 'Completed RIAC Intake Form', desc: 'The intake form you filled in (the PDF)', sentBefore: false },
    'rap-sheet': { name: 'Fingerprint RAP Sheet', desc: 'Repository inquiries are generally insufficient', sentBefore: true },
    'charging-documents': { name: 'All Accusatory Instruments', desc: 'Must include supporting affidavits / police reports', sentBefore: true },
    'family-court-pleadings': { name: 'Family Court Pleadings', desc: 'The petitions and any orders', sentBefore: false },
    'probation-paperwork': { name: 'Violation Of Probation Paperwork', desc: 'The declaration of delinquency, and the original sentence and conditions', sentBefore: false },
    'immigration-documents': { name: 'All Immigration Documents', desc: 'e.g. green card, work permit, USCIS receipt or passport visa', sentBefore: true },
    'immigration-advice': { name: 'Immigration Advice The Client Received', desc: 'A copy of any written advice', sentBefore: false },
    transcripts: { name: 'Transcripts', desc: 'e.g. the plea colloquy', sentBefore: false }
  };
  function docKinds(caseType, sendAs) {
    var k = [];
    if (sendAs === 'completed-form') k.push('completed-intake-form');
    k.push('rap-sheet');
    if (['criminal', 'appeal', 'post-conviction', 'removal'].indexOf(caseType) !== -1) k.push('charging-documents');
    if (caseType === 'family') k.push('family-court-pleadings');
    if (caseType === 'vop') k.push('probation-paperwork');
    k.push('immigration-documents');
    if (caseType === 'appeal' || caseType === 'post-conviction') k.push('immigration-advice', 'transcripts');
    return k;
  }

  window.RIAC_REF = {
    CONFIG: CONFIG, CENTRES: CENTRES, PDFS: PDFS, ADVICE_FIRST: ADVICE_FIRST, CASE_TYPES: CASE_TYPES, CHOICES: CHOICES, YNU: YNU,
    STEPS: { about: ABOUT, court: COURT, client: CLIENT, immigration: IMMIGRATION },
    SECTIONS: SECTIONS, DOCS: DOCS, docKinds: docKinds, has: has
  };
})();
