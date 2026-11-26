# Paid plans and Insights: legal page edits (draft)

> **What this is.** Paste-ready edits to the published Terms of Service and Privacy Policy
> (`pGeneral` documents `terms-of-service` and `privacy-policy`, English and 繁體中文, edited in
> vomatt-admin's Studio) for the plan in `docs/release/monetization.md`. Written against the pages
> as published on 2026-11-25.
>
> **Two parts.**
> - **Part A: paid plans.** Needed before anyone pays.
> - **Part B: Insights.** Publish only if you decide to sell statistics, and only together with
>   the opt-in setting. Until then the pages stay as they are on this point.
>
> **Cookies.** `/cookies-policy` redirects to Privacy Policy §8, so the cookie edits are in A2.6.
> The old `cookies-policy` documents are still published in Sanity; give them the same edit or
> unpublish them.
>
> **Placeholders.** Anything only the owner can fill is marked `[OWNER: ...]`. Remove the notes
> before publishing. Update "Last updated" on each page.
>
> **Not ready to publish as is.** Have a Taiwan lawyer review it first, in particular: the refund
> and 7-day cancellation wording (Consumer Protection Act Art. 19 and the exceptions rule for
> distance sales), the standard-contract rules for consumer terms, the liability cap, consent and
> notice for Insights (PDPA Arts. 7, 8, 19, 20), whether the statistics count as de-identified,
> the GDPR if members in the EU are served, and the election-poll publication ban (公職人員選舉
> 罷免法 Art. 53).
>
> **Tell members before it takes effect.** Both pages promise notice of significant changes. Send
> an email and show an announcement at least [OWNER: 30] days before the new text applies.

---

## Fix now, whatever you decide

The published Privacy Policy does not mention **gender**, but the app collects it in Edit profile
and the API returns it in Pro reports. Edit A2.1 fixes this; publish that line even if nothing
else here ships.

---

## Part A: paid plans

### A1. Terms of Service

#### A1.1 §1 What vomatt is

**Current:**
> vomatt is a voting platform. Anyone can read public polls; members can create polls, vote, comment, and follow other members and topics.

**Replace with:**
> vomatt is a voting platform. Anyone can read public polls; members can create polls, vote, comment, and follow other members and topics. Voting is free. Some features for people who run polls are part of a paid plan (section [OWNER: number of the new section]).

**中文：**
> vomatt 是一個投票平台。任何人都能閱讀公開投票；會員可以建立投票、投票、留言，並追蹤其他會員與主題。投票永遠免費。部分提供給發起投票者的功能屬於付費方案（見第 [OWNER: 新條號] 條）。

#### A1.2 New section: Community accounts (insert after §3)

> **Community accounts**
>
> A community account is a page for a group, such as a club, a building or a team. It can't sign in by itself: its members act for it.
>
> The owner invites members and gives each one a role. Members are responsible for what they post as the community, and the owner is responsible for the account.
>
> How many community accounts you can own, and how many members each can have, depends on your plan. The limits are shown in Settings.
>
> If your plan changes and you own more community accounts than it allows, we'll ask you to choose which ones stay active. You have 7 days; after that we keep the earliest ones active and lock the rest. A locked account and its polls are kept, and it unlocks when your plan has room again.

**中文：**
> **社群帳號**
>
> 社群帳號是團體（例如社團、社區大樓或團隊）的頁面。它無法自行登入，而是由成員代表它操作。
>
> 擁有者可以邀請成員，並指定每位成員的角色。成員需為自己以社群名義發布的內容負責，擁有者則需為該帳號負責。
>
> 你可以擁有幾個社群帳號、每個帳號可以有多少成員，取決於你的方案。上限會顯示在「設定」中。
>
> 如果你的方案變更後，擁有的社群帳號超過上限，我們會請你選擇要保留哪些。你有 7 天可以選擇；逾期我們會保留最早建立的帳號，並鎖定其餘帳號。被鎖定的帳號與其投票都會保留，等你的方案有空位時即可解鎖。

#### A1.3 New section: Pro and paid plans (insert before "Ending your account")

> **Pro and paid plans**
>
> **Who sells it.** Paid plans are sold by [OWNER: registered company name, 統一編號, registered address] ("we").
>
> **What you get.** The features of each plan are listed on the plans page at the time you buy. We may add features, and we may change or remove one for good reason. If we remove a feature that matters to your plan, you can cancel and get back the unused part of what you paid.
>
> **Pro polls.** In a Pro poll, only members who have confirmed a phone number can vote, and nobody, including you, can see what each person chose. The report shows totals by group, such as age range and gender. Groups too small to keep people private are merged. Don't try to work out how any one person voted.
>
> **Price and tax.** The price shown at checkout is in New Taiwan dollars and includes tax. We send a receipt and an e-invoice (電子發票) to the email address on your account.
>
> **Renewal.** A subscription renews at the end of each period, monthly or yearly, and we charge the payment method you gave. Before a yearly plan renews, we email you at least [OWNER: 7] days ahead.
>
> **Cancelling.** You can cancel at any time in Settings. You keep the plan until the end of the period you paid for, and you aren't charged again.
>
> **Refunds.** If you ask within 7 days of your first payment for a plan, we refund it in full. After that, payments aren't refunded, except where the law gives you that right or these Terms say otherwise. [OWNER: this is the simple option. The other is "no refund once you use a paid feature", which the checkout must state and the buyer must agree to before paying; ask the lawyer.]
>
> **Single purchases.** A poll pass covers one poll. If the poll never opens, ask us within 30 days and we'll refund it.
>
> **Price changes.** If we change the price of your plan, we'll email you at least 30 days before your next renewal. If you don't agree, cancel before it renews.
>
> **If a payment fails.** We'll tell you and try again for up to [OWNER: 7] days. If it still fails, your account moves to the free plan. Nothing is deleted.
>
> **When a plan ends.** Your account goes back to the free limits. Your polls, votes and reports stay. Community accounts over the free limit are handled as described in "Community accounts"; members already in a community stay.
>
> **App stores.** If you buy through Apple's App Store, Apple takes the payment, and its terms cover billing, cancelling and refunds. Manage that subscription in your Apple account. [OWNER: delete if Pro is sold on the web only.]
>
> **Under 18.** You need a parent's or guardian's permission to buy.

**中文：**
> **Pro 與付費方案**
>
> **由誰提供。** 付費方案由 [OWNER: 公司登記名稱、統一編號、登記地址]（以下稱「我們」）販售。
>
> **你會得到什麼。** 各方案的功能以你購買當時方案頁面所列為準。我們可能新增功能，也可能基於正當理由變更或移除某項功能。如果我們移除了對你的方案很重要的功能，你可以取消方案，並取回已付費用中尚未使用的部分。
>
> **Pro 投票。** 在 Pro 投票中，只有已驗證手機號碼的會員可以投票，而且包括你在內，沒有人看得到每個人的選擇。報告會顯示各群組（例如年齡層與性別）的總數；人數太少、可能讓人被認出的群組會被合併。請勿嘗試推斷任何個人的投票內容。
>
> **價格與稅金。** 結帳時顯示的價格以新臺幣計價，並已含稅。我們會將收據與電子發票寄到你帳號的電子郵件地址。
>
> **續訂。** 訂閱會在每期（每月或每年）結束時自動續訂，並向你提供的付款方式收款。年繳方案續訂前，我們會至少提前 [OWNER: 7] 天以電子郵件通知你。
>
> **取消。** 你可以隨時在「設定」中取消。取消後，你仍可使用方案到已付費期間結束為止，之後不會再收款。
>
> **退款。** 在你首次為某方案付款後 7 天內提出申請，我們會全額退款。超過 7 天後不予退款，但法律賦予你該項權利，或本條款另有規定者，不在此限。[OWNER: 這是較簡單的做法。另一種是「一旦使用付費功能即不退款」，但必須在結帳頁面載明，並在付款前取得購買者同意；請諮詢律師。]
>
> **單次購買。** 單次投票方案適用於一個投票。如果該投票始終沒有開放，請在 30 天內告訴我們，我們會退款。
>
> **價格調整。** 如果我們調整你方案的價格，會在下次續訂前至少 30 天以電子郵件通知你。如果你不同意，請在續訂前取消。
>
> **付款失敗。** 我們會通知你，並在最多 [OWNER: 7] 天內重試。若仍然失敗，你的帳號會改為免費方案，不會刪除任何資料。
>
> **方案結束後。** 你的帳號會回到免費方案的上限。你的投票、選票與報告都會保留。超過免費上限的社群帳號，依「社群帳號」一節處理；已加入社群的成員會保留。
>
> **應用程式商店。** 如果你透過 Apple App Store 購買，款項由 Apple 收取，帳務、取消與退款適用 Apple 的條款。請在你的 Apple 帳號中管理該訂閱。[OWNER: 若 Pro 只在網站販售，請刪除本段。]
>
> **未滿 18 歲。** 購買前需取得父母或監護人的同意。

#### A1.4 §4 Voting: one added line

**Add at the end of the section:**
> Some polls accept votes only from members who have confirmed a phone number. The poll says so before you vote.

**中文：**
> 部分投票只接受已驗證手機號碼的會員投票。投票前，該投票會清楚告訴你。

#### A1.5 §10 Disclaimers and liability

**Current:**
> vomatt is free and in early development: features may change or be removed, and the Service may be interrupted or, rarely, lose data. It’s provided “as is”. To the extent the law allows, we aren’t liable for indirect or consequential losses, or for content posted by members. Nothing in these Terms limits rights you have under consumer law that can’t be excluded.

**Replace with:**
> vomatt is in early development: features may change or be removed, and the Service may be interrupted or, rarely, lose data. It’s provided “as is”. To the extent the law allows, we aren’t liable for indirect or consequential losses, or for content posted by members. If you pay for a plan, our total liability to you is limited to what you paid us in the 12 months before the claim. None of this limits liability for harm we cause on purpose or through gross negligence, or rights you have under consumer law that can’t be excluded.

**中文：**
> vomatt 仍在早期開發階段：功能可能變更或移除，服務可能中斷，少數情況下也可能遺失資料。本服務依「現狀」提供。在法律允許的範圍內，我們不對間接或衍生損害，或會員發布的內容負責。如果你購買了付費方案，我們對你的賠償責任總額，以你在請求發生前 12 個月內支付給我們的金額為限。以上規定不限制我們因故意或重大過失所致損害的責任，也不限制你依消費者保護相關法律享有、且不得排除的權利。

(The published Chinese §10 has a typo, 「衝生損害」; the text above corrects it to 「衍生損害」. §4 has another: 「串通灶票」 should be 「串通灌票」.)

---

### A2. Privacy Policy

#### A2.1 §1 Information you give us

**Current:**
> Profile: username, display name, bio and profile picture: one of our characters, or a photo you upload. Optionally, your first and last name, birthday and location.

**Replace with:**
> Profile: username, display name, bio and profile picture: one of our characters, or a photo you upload. Optionally, your first and last name, birthday, gender and location.

**中文（取代現有段落）：**
> 個人資料：使用者名稱、顯示名稱、自我介紹與大頭貼（我們的角色之一，或你上傳的照片）。你也可以選擇填寫姓名、生日、性別與所在地。

**Add after "Reports and feedback":**
> Phone number: only if you confirm one, which some polls require before you vote. We use it to check that one person has one vote. It’s never shown to others and we don’t send marketing messages to it.
>
> Payments: if you buy a plan, our payment provider handles your card or other payment details; we never see or store the full card number. We keep which plan you’re on, what you paid and when, and what your e-invoice needs (for example a carrier code or company tax ID, if you give one).

**中文：**
> 手機號碼：只有在你驗證手機號碼時才會蒐集；部分投票要求先驗證才能投票。我們用它確認一人一票。它絕不對他人顯示，我們也不會傳送行銷訊息。
>
> 付款：如果你購買方案，你的信用卡或其他付款資料由我們的金流服務商處理；我們看不到、也不儲存完整卡號。我們會保存你使用的方案、付款金額與時間，以及開立電子發票所需的資料（例如你提供的載具條碼或統一編號）。

Also change "You need an email address to create an account" only if phone-only sign-up is opened; today it stays.

#### A2.2 §2 How we use it

**Add two bullets:**
> Provide paid plans: take payment, issue invoices, and apply your plan’s limits.
>
> Produce poll reports for the people who run polls (section 3).

**In "Legal bases", replace** "performing our contract with you" **with** "performing our contract with you, including paid plans".

**中文：**
> 提供付費方案：收款、開立發票，並套用你方案的上限。
>
> 為發起投票的人製作投票報告（見第 3 節）。

（「法律依據」中，將「履行我們與你之間的契約」改為「履行我們與你之間的契約（包括付費方案）」。）

#### A2.3 §3 What others can see: poll reports

The Pro report already exists in the API, so this belongs in the policy as soon as any Pro poll runs.

**Add after "Anonymous votes":**
> Poll reports: the creator of a Pro poll gets a report after it ends. It shows how many voters in each age range and of each gender chose each option, and turnout over time. It never shows names or usernames. A group with fewer than [OWNER: `report_min_cell_size`] voters is merged with others so nobody can be picked out. If you haven’t given your birthday or gender, you’re counted as “not provided”. Under-18s are counted as one group.

**中文：**
> 投票報告：Pro 投票結束後，建立者會取得一份報告，內容是各年齡層、各性別中有多少人選了每個選項，以及投票人數隨時間的變化。報告絕不顯示姓名或使用者名稱。人數少於 [OWNER: `report_min_cell_size`] 人的群組會與其他群組合併，避免任何人被認出。如果你沒有填寫生日或性別，會被計入「未提供」。未滿 18 歲者合併為一組。

**Also in §3, "Never shown to others". Current:**
> Never shown to others: your email address, birthday and block list.

**Replace with:**
> Never shown to others: your email address, phone number, birthday, payment details and block list.

**中文：**
> 絕不對他人顯示：你的電子郵件地址、手機號碼、生日、付款資料與封鎖名單。

[OWNER: gender has a visibility setting in the app; add it to "Hidden unless you show them" or "Public unless you hide them" to match its default.]

#### A2.4 §4 Who we share it with

**Add to the provider list:**
> [OWNER: payment provider name and country]: taking payments for paid plans. They receive your payment details and the amount, not your votes.
>
> [OWNER: SMS provider name and country]: sending the code that confirms your phone number.
>
> [OWNER: Apple, if Pro is sold in the iOS app]: App Store purchases. Apple tells us that you paid, not your card details.

**中文：**
> [OWNER: 金流服務商名稱與國家]：收取付費方案的款項。他們會收到你的付款資料與金額，但不會收到你的投票內容。
>
> [OWNER: 簡訊服務商名稱與國家]：傳送驗證手機號碼的驗證碼。
>
> [OWNER: Apple（若 Pro 在 iOS App 內販售）]：App Store 購買。Apple 只會告訴我們你已付款，不會提供你的卡片資料。

#### A2.5 §5 How long we keep it

**Add:**
> Payment records: [OWNER: 5] years after the payment, because tax law requires it, even if you delete your account. They hold the amount, date and invoice details, not your votes.
>
> Phone number: until you remove it or delete your account.
>
> Poll reports: kept with the poll and deleted with it.

**In "When you delete your account", add at the end:**
> Payment records are the one exception, as explained below.

**中文：**
> 付款紀錄：付款後保存 [OWNER: 5] 年，因為稅法要求保存，即使你刪除帳號也一樣。其中只有金額、日期與發票資料，不含你的投票內容。
>
> 手機號碼：保存到你移除它或刪除帳號為止。
>
> 投票報告：與投票一併保存，並隨投票刪除。

（「當你刪除帳號時」段落最後加上：「付款紀錄是唯一的例外，說明如下。」）

#### A2.6 §8 Cookies

**Add after the "Analytics" block:**
> Payments (only on checkout pages)
>
> When you pay, our payment provider may set its own cookies to process the payment and prevent fraud. They’re set only on the checkout pages, and we can’t read them. [OWNER: list each cookie's name, purpose and lifetime once the provider is chosen, or say "none" if checkout is a redirect to the provider's own site.]

**中文：**
> 付款（僅限結帳頁面）
>
> 你付款時，我們的金流服務商可能會設定自己的 Cookie，用來處理付款與防止詐騙。這些 Cookie 只會在結帳頁面設定，我們無法讀取。[OWNER: 選定金流服務商後，列出每個 Cookie 的名稱、用途與效期；若結帳是跳轉到服務商自己的網站，則寫「無」。]

#### A2.7 §9 Children

**Add:**
> If you’re under 18, you need a parent’s or guardian’s permission to buy a plan.

**中文：**
> 未滿 18 歲者，購買方案前需取得父母或監護人的同意。

---

## Part B: Insights (only if you sell statistics)

Build first, publish second: the setting in B3 has to exist before this text goes live. Data
from members who never turned the setting on stays out.

### B1. Privacy Policy

#### B1.1 New section: Research and Insights (insert after §3)

> **Research and Insights**
>
> We make statistics about how groups of people vote on public polls, and we may share or sell them to organizations such as researchers, media and companies. For example: “62% of voters aged 30–39 in Taipei chose option A.”
>
> You decide whether you’re included. The setting is in Settings > Privacy and safety, and it’s off unless you turn it on.
>
> If it’s on, we use your age range, your gender, your city or county and your votes on public polls to make these statistics.
>
> What we never do:
>
> - We never share or sell information about you as a person: no names, usernames, email addresses, phone numbers, birthdays or lists of one person’s votes, with or without a name attached.
> - We never show a number for a group of fewer than [OWNER: 30] people.
> - We never use votes on unlisted, invite-only or community polls.
> - We never include anyone under 18.
> - We never include an anonymous vote unless you turned the setting on; then it’s counted only in totals.
>
> Organizations that receive Insights agree in writing not to try to identify anyone, not to combine the statistics with other data to do so, and not to pass them on. We list who they are at [OWNER: link to the page].
>
> You can turn the setting off at any time. From then on, your votes aren’t used in new statistics. Statistics already made can’t be changed, because they no longer contain anything that points to you.
>
> Commissioned polls: an organization can pay us to ask a question. These polls are labelled “Commissioned by” with the organization’s name, and they follow the same rules as every other poll. The organization gets a poll report (section 3), nothing more.

**中文：**
> **研究與洞察**
>
> 我們會針對公開投票，統計不同群體的投票情形，並可能將這些統計提供或販售給研究者、媒體與企業等機構。例如：「臺北市 30–39 歲的投票者中，有 62% 選了選項 A。」
>
> 是否納入由你決定。這項設定在「設定」>「隱私與安全」中，除非你開啟，否則預設為關閉。
>
> 開啟後，我們會使用你的年齡層、性別、所在縣市，以及你在公開投票中的選票來製作這些統計。
>
> 我們絕不會做的事：
>
> - 絕不提供或販售關於你個人的資料：不論是否附上姓名，都不包括姓名、使用者名稱、電子郵件地址、手機號碼、生日，或任何一個人的投票清單。
> - 絕不顯示少於 [OWNER: 30] 人的群組的數字。
> - 絕不使用不公開列出、僅限受邀者或社群投票中的選票。
> - 絕不納入未滿 18 歲的人。
> - 除非你開啟這項設定，否則絕不納入匿名選票；即使納入，也只計入總數。
>
> 取得洞察的機構須以書面同意：不嘗試辨識任何人、不將統計與其他資料結合以辨識任何人，也不轉交給他人。我們在 [OWNER: 頁面連結] 列出這些機構。
>
> 你可以隨時關閉這項設定。關閉後，你的選票不會再用於新的統計。已完成的統計無法更改，因為其中已經沒有任何能指向你的內容。
>
> 委託投票：機構可以付費請我們發起一個問題。這類投票會標示「委託單位」與機構名稱，並適用與其他投票相同的規則。該機構只會取得投票報告（見第 3 節），沒有其他資料。

#### B1.2 §4 Who we share it with: the "don't sell" sentence

**Current:**
> We don’t sell your personal data or share it for advertising. We share it only with providers who help run vomatt, under contract:

**Replace with:**
> We don’t sell your personal data or share it for advertising. Insights (section [OWNER: number]) are statistics about groups, made only from members who chose to be included, and they contain nothing that identifies a person. We share personal data only with providers who help run vomatt, under contract:

**中文：**
> 我們不販售你的個人資料，也不為廣告而共享。洞察（見第 [OWNER: 節號] 節）是關於群體的統計，只以選擇加入的會員的資料製作，其中不含任何可辨識個人的內容。我們只與協助維運 vomatt、且受契約約束的服務供應商共享個人資料：

#### B1.3 §2 Legal bases

**Add to the list of legal bases:**
> your consent for including you in Research and Insights

**中文：** 你對於納入「研究與洞察」的同意

#### B1.4 §6 Your choices and rights

**Add:**
> Research and Insights: turn it on or off at any time in Settings > Privacy and safety.

**中文：**
> 研究與洞察：可隨時在「設定」>「隱私與安全」中開啟或關閉。

### B2. Terms of Service

**Add to §6 Rules, as a list item:**
> tries to identify a person from a poll report or from Insights;

**中文：** 試圖從投票報告或洞察中辨識任何個人；

**Add to "Results are not official":**
> The same goes for reports and Insights: they describe the people who took part, not the public as a whole.

**中文：**
> 報告與洞察也是如此：它們描述的是參與投票的人，而不是整體大眾。

### B3. The setting (wording for the app)

Off by default. Not part of sign-up. Shown in Settings > Privacy and safety, and offered once
after sign-up as a skippable prompt.

> **Help with research**
> Include my age group, gender and city in anonymous statistics about public polls. Organizations can buy these statistics. They never see who you are or how you voted. [Learn more]

> **協助研究**
> 將我的年齡層、性別與所在縣市納入公開投票的匿名統計。機構可以購買這些統計，但絕不會知道你是誰，也不會知道你投了什麼。[進一步了解]

Record the time and the wording version each time a member turns it on or off: the PDPA puts the
burden of proving consent on us.

### B4. Not in the pages, but needed before selling

- A contract for buyers with the three promises in B1.1 and a right to end it if they break one.
- A written record of how the statistics are made and checked (group sizes, merging, rounding).
- Location as a list of cities and counties, not free text.
- A decision on members in the EU, EEA and UK: leave them out, or get GDPR advice first.
