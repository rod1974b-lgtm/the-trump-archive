CREATE TYPE public.entry_kind AS ENUM ('event','accomplishment','setback','claim');
CREATE TYPE public.claim_rating AS ENUM ('true','mostly_true','mixed','mostly_false','false','unproven');

CREATE TABLE public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.entry_kind NOT NULL,
  term smallint NOT NULL CHECK (term IN (1,2)),
  occurred_on date NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  rating public.claim_rating,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_generated boolean NOT NULL DEFAULT false,
  source_url_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX entries_date_idx ON public.entries (occurred_on DESC);
GRANT SELECT ON public.entries TO anon, authenticated;
GRANT ALL ON public.entries TO service_role;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Entries are public" ON public.entries FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.bookmarks (
  user_id uuid NOT NULL,
  entry_id uuid NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, entry_id)
);
GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own bookmarks read" ON public.bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own bookmarks add" ON public.bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own bookmarks remove" ON public.bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.update_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  added integer NOT NULL DEFAULT 0,
  status text NOT NULL,
  message text
);
GRANT SELECT ON public.update_runs TO anon, authenticated;
GRANT ALL ON public.update_runs TO service_role;
ALTER TABLE public.update_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Runs are public" ON public.update_runs FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.entries (kind, term, occurred_on, title, summary, category, rating, sources) VALUES
('event',1,'2017-01-20','First inauguration','Donald Trump sworn in as the 45th President of the United States.','Government',NULL,'[{"title":"Wikipedia: First inauguration of Donald Trump","url":"https://en.wikipedia.org/wiki/First_inauguration_of_Donald_Trump"}]'),
('claim',1,'2017-01-21','Inauguration crowd "largest ever"','The White House claimed the 2017 inauguration drew the largest audience ever. Photo and ridership data showed smaller crowds than 2009.','Media','false','[{"title":"PolitiFact","url":"https://www.politifact.com/factchecks/2017/jan/21/sean-spicer/trump-had-biggest-inaugural-crowd-ever-metrics-don/"}]'),
('setback',1,'2017-01-27','Travel ban (EO 13769) blocked in courts','Executive order restricting entry from seven majority-Muslim countries was blocked by federal courts; a revised third version was upheld by the Supreme Court in 2018.','Immigration',NULL,'[{"title":"Wikipedia: Executive Order 13769","url":"https://en.wikipedia.org/wiki/Executive_Order_13769"}]'),
('accomplishment',1,'2017-04-10','Neil Gorsuch joins Supreme Court','Gorsuch confirmed and sworn in, the first of three Supreme Court appointments in the first term.','Judiciary',NULL,'[{"title":"Supreme Court biography","url":"https://www.supremecourt.gov/about/biographies.aspx"}]'),
('event',1,'2017-06-01','Withdrawal from Paris climate agreement announced','Announced U.S. exit from the Paris Agreement; withdrawal took effect Nov 4, 2020.','Environment',NULL,'[{"title":"Wikipedia: US withdrawal from the Paris Agreement","url":"https://en.wikipedia.org/wiki/United_States_withdrawal_from_the_Paris_Agreement"}]'),
('setback',1,'2017-07-28','ACA repeal fails in Senate','The "skinny repeal" of the Affordable Care Act failed 49-51.','Healthcare',NULL,'[{"title":"Wikipedia: Health Care Freedom Act","url":"https://en.wikipedia.org/wiki/Health_Care_Freedom_Act"}]'),
('accomplishment',1,'2017-12-22','Tax Cuts and Jobs Act signed','Cut the corporate rate from 35% to 21% and lowered individual rates (individual cuts expire after 2025). CBO projected ~$1.9T added to deficits over a decade.','Economy',NULL,'[{"title":"Congress.gov H.R.1","url":"https://www.congress.gov/bill/115th-congress/house-bill/1"},{"title":"CBO estimate","url":"https://www.cbo.gov/publication/53651"}]'),
('event',1,'2018-03-08','Steel and aluminum tariffs imposed','Section 232 tariffs of 25% on steel and 10% on aluminum, followed by escalating tariffs on China.','Trade',NULL,'[{"title":"Wikipedia: Trump tariffs","url":"https://en.wikipedia.org/wiki/Tariffs_in_the_first_Trump_administration"}]'),
('setback',1,'2018-04-06','Family separation under "zero tolerance"','Thousands of children separated from parents at the border; policy ended by executive order in June 2018 after widespread criticism.','Immigration',NULL,'[{"title":"DHS OIG report","url":"https://www.oig.dhs.gov/sites/default/files/assets/2019-10/OIG-20-06-Oct19.pdf"}]'),
('event',1,'2018-06-12','Singapore summit with Kim Jong Un','First meeting between a sitting U.S. president and a North Korean leader; no lasting denuclearization agreement followed.','Foreign Policy',NULL,'[{"title":"Wikipedia: 2018 Singapore summit","url":"https://en.wikipedia.org/wiki/2018_North_Korea%E2%80%93United_States_Singapore_Summit"}]'),
('accomplishment',1,'2018-10-06','Brett Kavanaugh confirmed','Confirmed 50-48 after contentious hearings.','Judiciary',NULL,'[{"title":"Senate roll call","url":"https://www.senate.gov/legislative/LIS/roll_call_votes/vote1152/vote_115_2_00223.htm"}]'),
('accomplishment',1,'2018-12-21','First Step Act signed','Bipartisan criminal justice reform reducing some federal sentences.','Justice',NULL,'[{"title":"Congress.gov S.756","url":"https://www.congress.gov/bill/115th-congress/senate-bill/756"}]'),
('setback',1,'2018-12-22','Longest government shutdown','35-day shutdown over border wall funding, ending Jan 25, 2019 without the requested funding.','Government',NULL,'[{"title":"Wikipedia: 2018–2019 shutdown","url":"https://en.wikipedia.org/wiki/2018%E2%80%932019_United_States_federal_government_shutdown"}]'),
('claim',1,'2019-01-10','"Mexico will pay for the wall"','Repeated campaign promise. Mexico did not pay; construction was funded by U.S. appropriations and reallocated military funds.','Immigration','false','[{"title":"FactCheck.org","url":"https://www.factcheck.org/2019/01/trumps-trade-deal-wont-pay-for-wall/"}]'),
('event',1,'2019-04-18','Mueller report released','Found insufficient evidence to charge a conspiracy with Russia; did not exonerate on obstruction.','Investigations',NULL,'[{"title":"DOJ: Mueller report","url":"https://www.justice.gov/archives/sco/file/1373816/dl"}]'),
('setback',1,'2019-12-18','First impeachment','House impeached on abuse of power and obstruction of Congress over Ukraine; acquitted by the Senate Feb 5, 2020.','Investigations',NULL,'[{"title":"Wikipedia: First impeachment of Donald Trump","url":"https://en.wikipedia.org/wiki/First_impeachment_of_Donald_Trump"}]'),
('accomplishment',1,'2019-12-20','Space Force established','Created as the sixth branch of the armed forces via the NDAA.','Defense',NULL,'[{"title":"U.S. Space Force","url":"https://www.spaceforce.mil/About-Us/About-Space-Force/"}]'),
('accomplishment',1,'2020-01-29','USMCA signed','Replaced NAFTA with updated trade agreement with Mexico and Canada.','Trade',NULL,'[{"title":"USTR: USMCA","url":"https://ustr.gov/trade-agreements/free-trade-agreements/united-states-mexico-canada-agreement"}]'),
('claim',1,'2020-02-27','COVID-19 "is going to disappear"','Said the virus would disappear "like a miracle." U.S. deaths exceeded 400,000 by January 2021.','Health','false','[{"title":"PolitiFact","url":"https://www.politifact.com/article/2020/apr/20/fact-checking-trumps-claims-coronavirus/"}]'),
('accomplishment',1,'2020-03-27','CARES Act signed','$2.2 trillion pandemic relief package including stimulus checks and PPP loans.','Economy',NULL,'[{"title":"Congress.gov H.R.748","url":"https://www.congress.gov/bill/116th-congress/house-bill/748"}]'),
('setback',1,'2020-04-30','Pandemic unemployment peaks','Unemployment hit 14.7% in April 2020 amid COVID-19 shutdowns.','Economy',NULL,'[{"title":"BLS","url":"https://www.bls.gov/opub/ted/2020/unemployment-rate-rises-to-record-high-14-point-7-percent-in-april-2020.htm"}]'),
('accomplishment',1,'2020-05-15','Operation Warp Speed','Public-private program that accelerated COVID-19 vaccine development; first vaccines authorized December 2020.','Health',NULL,'[{"title":"GAO report","url":"https://www.gao.gov/products/gao-21-319"}]'),
('accomplishment',1,'2020-09-15','Abraham Accords signed','Normalization agreements between Israel and the UAE and Bahrain, later Morocco and Sudan.','Foreign Policy',NULL,'[{"title":"State Department","url":"https://www.state.gov/the-abraham-accords/"}]'),
('accomplishment',1,'2020-10-26','Amy Coney Barrett confirmed','Third Supreme Court appointment, creating a 6-3 conservative majority.','Judiciary',NULL,'[{"title":"Senate roll call","url":"https://www.senate.gov/legislative/LIS/roll_call_votes/vote1162/vote_116_2_00224.htm"}]'),
('claim',1,'2020-11-04','Claims the 2020 election was stolen','Claimed widespread fraud. Over 60 lawsuits failed, and the DOJ and CISA found no fraud that would change the outcome.','Elections','false','[{"title":"AP","url":"https://apnews.com/article/barr-no-widespread-election-fraud-b1f1488796c9a98c4b1a9061a6c7f49d"},{"title":"CISA statement","url":"https://www.cisa.gov/news-events/news/joint-statement-elections-infrastructure-government-coordinating-council-election"}]'),
('setback',1,'2021-01-06','January 6 Capitol attack','Supporters stormed the Capitol during certification of the election results.','Elections',NULL,'[{"title":"House Select Committee report","url":"https://www.govinfo.gov/app/details/GPO-J6-REPORT"}]'),
('setback',1,'2021-01-13','Second impeachment','Impeached for incitement of insurrection; acquitted 57-43 (short of two-thirds) on Feb 13, 2021.','Investigations',NULL,'[{"title":"Wikipedia: Second impeachment","url":"https://en.wikipedia.org/wiki/Second_impeachment_of_Donald_Trump"}]'),
('claim',1,'2021-01-20','Tally of false or misleading claims','The Washington Post Fact Checker database recorded 30,573 false or misleading claims over the first term.','Media','false','[{"title":"Washington Post","url":"https://www.washingtonpost.com/politics/2021/01/24/trumps-false-or-misleading-claims-total-30573-over-four-years/"}]'),
('event',2,'2025-01-20','Second inauguration','Sworn in as the 47th President, the second to serve non-consecutive terms.','Government',NULL,'[{"title":"Wikipedia: Second inauguration","url":"https://en.wikipedia.org/wiki/Second_inauguration_of_Donald_Trump"}]'),
('event',2,'2025-01-20','Pardons for January 6 defendants','Granted clemency to roughly 1,500 people charged in connection with January 6.','Justice',NULL,'[{"title":"AP","url":"https://apnews.com/article/trump-jan-6-pardons"}]'),
('event',2,'2025-04-02','"Liberation Day" tariffs','Announced broad reciprocal tariffs on most trading partners, triggering market declines and later pauses and adjustments.','Trade',NULL,'[{"title":"Wikipedia: Liberation Day tariffs","url":"https://en.wikipedia.org/wiki/Liberation_Day_tariffs"}]'),
('accomplishment',2,'2025-07-04','One Big Beautiful Bill Act signed','Extended 2017 tax cuts and changed Medicaid, SNAP and energy credits; CBO projected large deficit increases and coverage losses.','Economy',NULL,'[{"title":"Congress.gov H.R.1 (119th)","url":"https://www.congress.gov/bill/119th-congress/house-bill/1"}]');