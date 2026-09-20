/*
 * rubric.js — the scoring model.
 *
 * This is the only file you need to edit to retune the instrument.
 * Weights across all dimensions must sum to 100. Each indicator needs
 * exactly five anchors, describing observable practice at scores 0-4.
 *
 * Everything else in the app derives from this file.
 */

window.RUBRIC_META = {
  version: "1.0.0",
  title: "Gender equity rubric",
  subtitle: "A weighted assessment of a venture firm and its portfolio",
  scale: [
    { n: 0, name: "Absent", gloss: "No practice, no data, never raised." },
    { n: 1, name: "Ad hoc", gloss: "Informal, inconsistent, person-dependent." },
    { n: 2, name: "Defined", gloss: "Written, applied, and recorded." },
    { n: 3, name: "Managed", gloss: "Measured against targets, with an owner." },
    { n: 4, name: "Leading", gloss: "Sustained and verified outside the firm." }
  ],
  bands: [
    { min: 0, label: "Absent" },
    { min: 25, label: "Emerging" },
    { min: 45, label: "Developing" },
    { min: 65, label: "Established" },
    { min: 85, label: "Leading" }
  ]
};

window.RUBRIC = [
{
  id: "A",
  title: "The firm",
  weight: 40,
  intro: "How the management company allocates power, pay and protection among its own people.",
  dims: [
    {
      id: "A1",
      name: "Decision-making power",
      weight: 12,
      purpose: "Representation without a vote and without carry is decoration. This measures who decides and who owns the upside.",
      inds: [
        {
          id: "A1.1",
          name: "Women in carry-bearing, IC-voting roles",
          metric: "Share of people holding both an investment committee vote and material carry who are women, on a three-year rolling basis.",
          anchors: [
            "No women hold an IC vote or material carry.",
            "One woman holds an IC vote or carry but not both; no visible path to partner.",
            "At least 20% of IC votes held by women, with at least one woman on a partner track.",
            "At least 30% of IC votes held by women, sustained three years, with written and applied promotion criteria.",
            "At least 40% sustained, including women in fund-level leadership such as managing partner, fund head or CIO."
          ]
        },
        {
          id: "A1.2",
          name: "Carry allocation share",
          metric: "Share of total carry points held by women, against their share of carry-eligible headcount.",
          anchors: [
            "Carry allocation is undisclosed internally and unmeasured.",
            "Allocation known to a few partners; women's carry share is under half their headcount share.",
            "Allocation tracked; women's carry share is 50-74% of headcount share.",
            "Women's carry share is 75-99% of headcount share and the allocation method is documented.",
            "Carry share at or above headcount share, method documented, and vesting and cliff terms uniform across partners."
          ]
        }
      ]
    },
    {
      id: "A2",
      name: "Pipeline, progression and retention",
      weight: 8,
      purpose: "Most firms lose women between associate and principal. This looks at the leak, not the intake.",
      inds: [
        {
          id: "A2.1",
          name: "Representation and promotion by level",
          metric: "Headcount and promotion rate at analyst, associate, principal and partner, disaggregated by gender.",
          anchors: [
            "No headcount data by level and gender.",
            "Headcount tracked in aggregate only; representation drops sharply above associate.",
            "Tracked by level, with promotion rates reviewed annually.",
            "Promotion rates within 10 points of parity at every level, with a named owner and documented corrective action.",
            "Parity sustained three or more years, with slate and interview-panel requirements applied and audited."
          ]
        },
        {
          id: "A2.2",
          name: "Retention and structured hiring",
          metric: "Regretted attrition by gender and level; use of structured interviews, scorecards and calibrated debriefs.",
          anchors: [
            "Attrition not analysed by gender; hiring is referral-led and unstructured.",
            "Exit data collected but not analysed; interview consistency is partial.",
            "Attrition analysed annually and structured interview guides used for investment roles.",
            "No material attrition gap, five points or less, for two years, with scorecards and calibrated debriefs standard.",
            "As above, plus exit interviews run by an independent party with findings acted on and reported to the partnership."
          ]
        }
      ]
    },
    {
      id: "A3",
      name: "Compensation equity",
      weight: 6,
      purpose: "Base pay gaps are the smallest part of the problem in venture. The gap lives in bonus and in carry.",
      inds: [
        {
          id: "A3.1",
          name: "Pay equity audit and remediation",
          metric: "Unadjusted and adjusted gaps across base, bonus and carry, and the record of what was fixed.",
          anchors: [
            "No pay gap analysis of any kind.",
            "Informal or one-off review, covering base pay only.",
            "Annual analysis of base and bonus; gaps identified but remediation is discretionary.",
            "Annual analysis including carry, with budgeted remediation completed within one cycle.",
            "Independent third-party audit including carry, remediation completed, and both unadjusted and adjusted gaps disclosed to LPs."
          ]
        }
      ]
    },
    {
      id: "A4",
      name: "Culture, safety and caregiving",
      weight: 8,
      purpose: "Whether it is safe to report, and whether having a child ends a career track.",
      inds: [
        {
          id: "A4.1",
          name: "Harassment prevention and reporting integrity",
          metric: "Policy scope, independence of reporting channels, use of NDAs, and tracking of substantiation and outcomes.",
          anchors: [
            "No written policy, or a policy that exists in name only.",
            "Policy exists but there is no independent channel, and NDAs are routine in settlements.",
            "Policy covers staff, founders and LPs; a confidential channel exists and cases are logged.",
            "Independent reporting channel; NDAs never used to bar disclosure to regulators or future employers; outcomes tracked.",
            "As above, plus anonymised case and outcome data reviewed annually by an independent body, and conduct expectations extended contractually to portfolio interactions."
          ]
        },
        {
          id: "A4.2",
          name: "Caregiving leave and return",
          metric: "Leave provisions, protection of carry vesting and deal clock during leave, and return-to-work retention at 12 and 24 months.",
          anchors: [
            "Statutory minimum only, with no practice for carry or deal clock during leave.",
            "Above-statutory leave for primary carers only; carry treatment decided case by case.",
            "Equal leave for all parents, with carry vesting explicitly protected during leave.",
            "As above, plus phased return, protection of IC role and seniority, and return retention tracked.",
            "Return retention at 24 months within five points of non-leave peers, and the provision set as a standard for portfolio companies."
          ]
        }
      ]
    },
    {
      id: "A5",
      name: "Accountability and disclosure",
      weight: 6,
      purpose: "Whether anyone carries consequences for the numbers, and whether anyone outside the firm can see them.",
      inds: [
        {
          id: "A5.1",
          name: "Reporting to LPs and the public",
          metric: "Frequency, audience and methodological transparency of equity reporting.",
          anchors: [
            "Nothing measured or reported.",
            "Figures assembled only when an LP asks.",
            "Annual internal report to the partnership.",
            "Annual report to all LPs using a consistent, stated methodology.",
            "Public annual disclosure including methodology, denominators and restatements of prior years."
          ]
        },
        {
          id: "A5.2",
          name: "Incentive linkage",
          metric: "Whether equity objectives affect partner evaluation, compensation or carry decisions.",
          anchors: [
            "No link between equity outcomes and any evaluation.",
            "Referenced in values statements only.",
            "A named partner is accountable and progress is reviewed by the partnership.",
            "Equity objectives form a written component of partner performance review.",
            "Objectives carry a defined weight in compensation or carry decisions, with results published internally."
          ]
        }
      ]
    }
  ]
},
{
  id: "B",
  title: "The portfolio",
  weight: 60,
  intro: "Where the firm's capital goes, on what terms, and what happens to founders afterwards.",
  dims: [
    {
      id: "B1",
      name: "Deal funnel equity",
      weight: 15,
      purpose: "Nearly all of the observed gap is produced upstream of the investment decision. This is the most diagnostic dimension in the rubric.",
      inds: [
        {
          id: "B1.1",
          name: "Sourcing channel dependence",
          metric: "Share of investments originating from warm introductions versus open, cold or programmatic channels, and how that mix differs by founder gender.",
          anchors: [
            "Sourcing is entirely relationship-driven and deal origin is not recorded.",
            "Origin recorded inconsistently; there is no open channel.",
            "Every deal's origin channel is logged and an open application channel exists.",
            "Open and programmatic channels produce at least 20% of new investments, with channel mix analysed by founder gender.",
            "As above, plus documented network expansion through scouts, programmes or new geographies, with measured effect on funnel composition."
          ]
        },
        {
          id: "B1.2",
          name: "Stage-by-stage conversion parity",
          metric: "Conversion from screen to first meeting to partner meeting to IC to term sheet, by founder gender, controlled for stage, sector and geography.",
          anchors: [
            "Funnel is not tracked by founder gender.",
            "Only the top of the funnel is tracked.",
            "Full funnel tracked by founder gender; gaps described but uncontrolled.",
            "Conversion analysed with stage and sector controls, and unexplained gaps investigated by a named owner.",
            "No unexplained gap greater than five points at any stage for two consecutive years, with the analysis externally reviewed."
          ]
        },
        {
          id: "B1.3",
          name: "Bias-interrupted diligence",
          metric: "Consistency of questions, written evaluation criteria and reference protocols across founders.",
          anchors: [
            "Diligence is improvised and partner-specific.",
            "A shared checklist exists but questioning is unstructured.",
            "A standard question set and written criteria apply to every company reaching partner meeting.",
            "As above, plus deliberate controls on known asymmetries, such as promotion- versus prevention-framed questioning, and standardised reference protocols.",
            "IC memos follow a fixed template with criteria pre-committed before diligence, and adherence is sampled and audited."
          ]
        }
      ]
    },
    {
      id: "B2",
      name: "Capital allocation outcomes",
      weight: 18,
      purpose: "The headline result, measured in dollars, because deal count flatters almost every portfolio.",
      inds: [
        {
          id: "B2.1",
          name: "Share of capital deployed",
          metric: "Percentage of dollars invested, not deals closed, into companies with a woman founder, a woman CEO, and women holding a majority of founding equity, reported as three separate figures.",
          anchors: [
            "Not measured, or measured by deal count only.",
            "Deal count reported; dollars not separated out.",
            "Dollars reported under a single broad definition.",
            "Dollars reported under all three definitions against a stated available-market denominator, with targets set.",
            "Targets met or exceeded for three years against the market denominator, with figures disclosed publicly."
          ]
        },
        {
          id: "B2.2",
          name: "First-cheque size parity",
          metric: "Median and mean initial cheque into women-led versus men-led companies, matched on stage, sector and geography.",
          anchors: [
            "Not analysed.",
            "Analysed in aggregate with no matching.",
            "Analysed with matching, and gaps noted.",
            "Matched median within 10%, with deviations explained deal by deal.",
            "Matched median within 5% for two years, with methodology disclosed."
          ]
        },
        {
          id: "B2.3",
          name: "Follow-on and reserve parity",
          metric: "Follow-on participation rate and reserve dollars per company by founder gender, matched on company performance.",
          anchors: [
            "Not tracked.",
            "Tracked at portfolio level only.",
            "Tracked by founder gender, without performance matching.",
            "Performance-matched follow-on rates within 10 points, with reserve decisions documented against written criteria.",
            "Parity sustained two years, with reserve criteria published internally and decisions audited."
          ]
        }
      ]
    },
    {
      id: "B3",
      name: "Terms and valuation parity",
      weight: 7,
      purpose: "Equal access to capital on unequal terms is not equity. Non-price terms matter as much as valuation.",
      inds: [
        {
          id: "B3.1",
          name: "Price and non-price term parity",
          metric: "Pre-money valuation, dilution taken, and non-price terms such as board control, liquidation preference and option pool, at matched stage and sector.",
          anchors: [
            "Not analysed.",
            "Valuations reviewed anecdotally.",
            "Matched valuation comparison performed annually.",
            "Matched valuation and dilution within 10%, with non-price terms reviewed for systematic differences.",
            "Parity on price and non-price terms sustained two years, with findings reported to LPs."
          ]
        }
      ]
    },
    {
      id: "B4",
      name: "Portfolio governance and standards",
      weight: 12,
      purpose: "What the firm does with the influence it buys: board seats it controls, and the conditions it attaches to money.",
      inds: [
        {
          id: "B4.1",
          name: "Board composition and firm-appointed seats",
          metric: "Gender composition of portfolio boards overall, and specifically of seats the firm holds, appoints or influences.",
          anchors: [
            "Board composition is not recorded.",
            "Recorded but not analysed; firm-appointed seats are overwhelmingly one gender.",
            "Composition recorded across the portfolio, with independent-seat candidates drawn from mixed slates.",
            "At least 30% of firm-appointed and firm-influenced seats held by women, with mixed slates required for every independent seat.",
            "At least 40% sustained, and a written board-composition plan required as a condition of leading a round."
          ]
        },
        {
          id: "B4.2",
          name: "Executive representation across the portfolio",
          metric: "Share of portfolio companies reporting executive-team composition, and the resulting representation benchmarked by stage.",
          anchors: [
            "Not collected.",
            "Collected from some companies on request.",
            "Collected annually from a majority of the portfolio using a consistent definition of executive.",
            "Collected from at least 80% of the portfolio, benchmarked by stage and shared back to founders.",
            "As above, plus targeted support such as search-firm access or talent networks where representation lags, with measured effect."
          ]
        },
        {
          id: "B4.3",
          name: "Required portfolio-company standards",
          metric: "Whether pay-equity review, parental leave and a harassment policy are expected, contracted or verified.",
          anchors: [
            "No expectations are set.",
            "Encouraged informally at onboarding.",
            "A written standard is shared with every new investment.",
            "Standards are a side-letter or post-close condition on led rounds, with annual self-certification.",
            "Compliance verified rather than self-certified, with support offered and a defined escalation path for persistent gaps."
          ]
        }
      ]
    },
    {
      id: "B5",
      name: "Support and outcomes",
      weight: 8,
      purpose: "Post-investment attention is a real and rarely measured form of capital. Outcomes here are reported, never targeted: a target on exit multiples by founder gender would corrupt the measure.",
      inds: [
        {
          id: "B5.1",
          name: "Distribution of firm resources",
          metric: "Allocation of partner time, talent and customer introductions, and internal follow-on advocacy, by founder gender.",
          anchors: [
            "Support is untracked.",
            "Support logged informally by individual partners.",
            "Partner time and introductions logged systematically.",
            "Distribution analysed by founder gender, controlled for stage and company performance, with gaps addressed.",
            "No unexplained gap for two years, and portfolio founders surveyed anonymously on support quality with results acted on."
          ]
        },
        {
          id: "B5.2",
          name: "Outcome reporting",
          metric: "Markups, exits, write-offs and MOIC by founder gender, reported with sample sizes and stated uncertainty.",
          anchors: [
            "Not reported.",
            "Reported ad hoc, without sample sizes.",
            "Reported annually with sample sizes.",
            "Reported with sample sizes and uncertainty, and used to test whether funnel and cheque-size decisions were well calibrated.",
            "As above, published externally with methodology, including years in which the results were unfavourable."
          ]
        }
      ]
    }
  ]
}
];

window.RUBRIC_CAUTIONS = [
  ["Small numbers move percentages, not reality.", "In a twelve-person firm one hire swings representation by eight points. Use three-year rolling figures and suppress any cell with fewer than five people."],
  ["Dollars and deal counts diverge sharply.", "A portfolio can be 30% women-founded by company count and 9% by capital deployed. Report both, and weight the dollar figure."],
  ["Choose the denominator honestly.", "Parity is not automatically 50%. Benchmark against the addressable founder population in your sectors, stages and geographies, state which denominator you used, and keep it stable year to year."],
  ["Definitions are gameable.", "At least one woman founder is the weakest defensible definition and the easiest to inflate. Report it alongside woman-CEO and majority-women-founding-equity figures."],
  ["Gender data is self-identified and often legally sensitive.", "Collect by voluntary self-identification with a non-binary option and a decline option. Never infer from names or photographs. In the EU and UK this is special-category personal data, so confirm your lawful basis first."],
  ["Funnel gaps need controls.", "Raw conversion differences may reflect the sector mix of who applies. Control for stage, sector and geography, or you are measuring your pipeline rather than your judgement."]
];
