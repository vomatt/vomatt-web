# vomatt launch pages — draft

> **What this is.** Paste-ready text for three new help/legal pages on the about site (about.vomatt.com), plus exact edits to the published Privacy Policy, Cookies Policy and the sign-up policy message. Written to match what the code does today (vomatt-web and vomatt-api, checked November 2026).
>
> **Sanity documents to create** (all in the shared dataset, edited in vomatt-admin's Studio):
> - `pGeneral` "Community Guidelines", slug `community-guidelines`
> - `pGeneral` "Reporting and appeals", slug `report`
> - `pGeneral` "Your data", slug `your-data`
> - Edits to the existing `pGeneral` documents `privacy-policy` and `cookies-policy` (section 4 below), and to the `pSignUp` singleton's `policyMessage` (section 5).
>
> In vomatt-web, link to the new pages with `aboutHref('community-guidelines', currentLanguage)` etc. (`src/lib/aboutSite.ts`); the root `[slug]` route there is profiles only. Links written inside the pages below as `/report` etc. are internal links to the other about-site documents.
>
> **Chinese versions (section 6).** Sanity content isn't localized today, and the published legal pages are English only. [OWNER: decide how the Chinese pages are served, for example separate `pGeneral` documents with slugs such as `zh-community-guidelines`, or adding localization to the about site.]
>
> **Placeholders.** Anything only the owner can fill is marked `[OWNER: ...]`. Remove the bracketed notes before publishing.
>
> **Have a lawyer review this before publishing**, in particular: the copyright notice and counter-notice process (Taiwan Copyright Act Chapter VI-1, and the US DMCA if US users are targeted), response times under Taiwan's PDPA (Art. 13) and the GDPR (Art. 12), the EU Digital Services Act notice, statement-of-reasons and appeal wording (Arts. 16, 17, 20) if EU users are served, and the duty to report child sexual abuse material.

---

## 1. Community Guidelines

_Slug: `community-guidelines`_

# Community Guidelines

_Last updated: [OWNER: date]_

vomatt works when people can trust the result. These guidelines explain what that asks of everyone who creates polls, votes and comments. They sit alongside our [Terms of Service](/terms-of-service); if the two ever differ, the Terms apply.

## What's welcome

- Clear questions people can weigh in on: your street, your team, a topic, a public decision.
- Polls about public figures and organisations in their public role.
- Disagreement, with reasons.
- Sharing your poll anywhere, so more people take part.

## What's not allowed

**Polls about private people.** Don't make a poll that names, rates or judges a private person, such as a neighbour, classmate or coworker, without their agreement.

**Exposing people.** Don't post someone's personal details: their real name, address, phone number, workplace, school, or photos and accounts they keep private. Don't use @mentions or invitations to point other people at someone, or pair a mention with their personal details.

**Rigging the vote.** One person, one account, one vote. Don't use extra accounts, scripts or bought votes. Don't offer rewards for voting a certain way. Don't organise groups to flood a poll or its comments.

**Misleading civic polls.** Don't present a poll as an official election, referendum or survey, or as coming from a government, party or candidate when it doesn't. Don't post false information about when, where or how to vote in a real election. Results on vomatt reflect the people who took part; they are never official.

**Hate and harassment.** No attacks on people for their race, ethnicity, nationality, religion, disability, illness, sex, gender identity, sexual orientation or age. No threats, no bullying, and no repeatedly targeting someone who doesn't want contact.

**Sexual content.** No sexually explicit content. Never any sexual content involving minors: we remove it, close the account and report it to the authorities.

**Illegal content.** Nothing that's illegal in Taiwan or where you are, including scams, promoting violence, selling regulated goods, or infringing someone's copyright or trademark.

**Spam.** No advertising, repeated posts, or invitations sent to people who don't expect them.

## Usernames, display names and bios

Your profile is public. Don't use a name or bio that impersonates a person or organisation, contains slurs or sexual content, or includes someone's personal details. Avatars come from our own set of characters, so there's nothing to upload. If your profile breaks these rules, we'll ask you to change it, and we may suspend the account until you do.

## What we do when something breaks the rules

A person looks at what was posted, the harm it can cause and the account's history, and usually takes the smallest step that fixes the problem:

1. Remove the comment or poll. A removed poll is hidden from everyone, even if votes were cast on it.
2. Warn you by email.
3. Suspend the account. While it's suspended, its profile and polls are hidden.
4. Close the account for good.

For serious harm, such as threats, exposing someone, sexual content involving minors or large-scale vote rigging, we may go straight to the last step and, where the law requires it, tell the authorities.

We'll tell you what we did and why, and you can appeal. See [Reporting and appeals](/report).

## Blocking

You can block anyone from their profile. Their polls and comments stop showing up for you, and your polls are no longer reachable for them. They aren't told. If they're also breaking these rules, please report them too.

## Reporting

Signed-in members can report a poll or comment from its menu. For anything else, or if you don't have an account, email us. See [Reporting and appeals](/report).

---

## 2. Reporting and appeals

_Slug: `report`_

# Reporting and appeals

_Last updated: [OWNER: date]_

If something on vomatt breaks our [Community Guidelines](/community-guidelines) or the law, tell us. A person reads every report.

## Report in the app

If you're signed in, open the menu on a poll or comment and choose Report. Pick a reason and add a note if it helps. We don't tell the poster that you reported them.

In-app reporting covers polls and comments. To report a profile (a username, display name or bio) or anything else, email us.

## Report by email

Anyone can email [hello@vomatt.com](mailto:hello@vomatt.com), with or without an account. That includes people a poll or comment is about, and people who hold rights in something posted. Put "Report" in the subject and include:

- the link to the poll or profile; for a comment, also the commenter's username and the first few words of the comment;
- what's wrong with it, and if you think it's illegal, which law and why;
- your name and email address, so we can reply (you can leave your name out if you're reporting sexual content involving a child);
- a statement that you believe your report is accurate and made in good faith.

If a post is about you, say so. We look at those first.

## Copyright

If you own the rights to something posted on vomatt, or act for the owner, email us with "Copyright" in the subject and:

- your name, address, phone number and email;
- the work you own, and where the original can be found;
- the link to the content you say infringes it;
- a statement that you believe in good faith this use isn't allowed by the owner, their agent or the law;
- a statement that your notice is accurate and that you're the owner or allowed to act for them;
- your signature (your typed full name is fine).

We'll remove or disable the content and tell the person who posted it. We may pass your notice, including your name and contact details, to them so they can respond.

[OWNER: if vomatt serves US users, register a DMCA designated agent with the US Copyright Office and add the agent's details here.]

### Counter-notices

If your content was removed after a copyright notice and you believe that was a mistake, or that you're allowed to use it, reply to our email with: your name, address, phone number and email; what was removed and where it was; a good-faith statement of why; your agreement to the jurisdiction of [OWNER: court, e.g. the Taiwan Taipei District Court] for any claim about it; and your signature. We'll send it to the person who sent the notice. If they don't tell us within 10 working days that they've started legal action, we may restore the content.

## What happens next

- We confirm email reports within [OWNER: 2] working days.
- We aim to decide within [OWNER: 7] days. Threats, exposed personal details and sexual content involving minors come first; we act on those within [OWNER: 24 hours].
- We may remove the content, leave it up, or take further steps under our Community Guidelines. If you emailed us, we'll tell you what we decided. In-app reports don't get an individual reply; if you need one, email us as well.

## If we act on your content or account

We'll email the address on your account. We'll say what we removed or changed, which rule or law it broke, and how to appeal. Decisions are made by a person. We don't tell you who reported you, except for copyright notices as explained above. We may not tell you first if that would put someone at risk or the law doesn't allow it.

## Appeals

If you think we got it wrong, reply to that email, or write to [hello@vomatt.com](mailto:hello@vomatt.com) with "Appeal" in the subject, within 6 months. Tell us what you think we missed. We'll review the decision again, taking your reasons into account, and reply within [OWNER: 14] days. If we were wrong, we'll restore the content or the account.

You can also take the matter to court. If you live in the EU, you can use a certified out-of-court dispute settlement body.

---

## 3. Your data

_Slug: `your-data`_

# Your data

_Last updated: [OWNER: date]_

This page explains what vomatt keeps about you and how to get a copy, fix it or delete it. The [Privacy Policy](/privacy-policy) has the full details.

## What we store

- **Your email address**, which you sign in with, and passkeys if you add them (we keep only the public key).
- **Your profile:** username, display name, bio, avatar, and if you add them, your name, birthday and location.
- **What you do:** polls you create, votes, comments, likes, bookmarks, follows, blocks, invite lists, reports and feedback.
- **Security records:** your IP address and browser type when you sign in or change your account, kept for 180 days.

We don't sell your data or use it for advertising.

## Get a copy

Email [hello@vomatt.com](mailto:hello@vomatt.com) from the address on your account, with "Data request" in the subject. We'll send you a file with your profile, settings, polls (including deleted ones), comments, votes, follows, blocks, bookmarks, followed topics and feedback.

[OWNER: once the Settings button ships, replace the paragraph above with: "In Settings, choose Download your data to get the file straight away. You can download it once a day. You can also ask us by email."]

If you want something that isn't in the file, such as your security records, ask and we'll tell you what we hold.

## Fix or change it

- Edit your profile at any time in Settings.
- Choose who sees each profile detail, and whether you vote anonymously by default.
- Change or withdraw your vote while a poll is open.
- To change the email address on your account, email us from your current address and tell us the new one. We'll confirm the new address before we switch it.

## Delete it

- **A comment:** delete it from its menu. It's hidden from everyone straight away. We keep the text until your account is deleted, so we can handle reports about it.
- **A poll:** you can delete it while it's scheduled or within 20 minutes of creating it. It's hidden straight away. We keep it, with its votes and comments, until your account is deleted.
- **Your account:** delete it in Settings. It happens immediately and can't be undone. It removes:
  - your profile, email address, passkeys, follows, blocks, bookmarks and invite lists;
  - your votes, which are taken out of each poll's totals;
  - your comments, and the replies others left under them;
  - the polls you created, with every vote and comment others left on them;
  - your reports and feedback.

  Your entries in our security logs are anonymized. [OWNER: copies in database backups expire within N days; confirm the Neon restore window and add it here.]

## Anonymous votes

If you vote anonymously, your name stays off voter lists. Within a day after the poll ends, we delete the link between your vote and the option you chose, so not even we can see it. Only the totals remain.

## Requests under privacy law

Under Taiwan's Personal Data Protection Act, the GDPR and similar laws, you can ask to see your data, get a copy, correct it, delete it, or ask us to stop collecting or using it. Email [hello@vomatt.com](mailto:hello@vomatt.com).

- **Checking it's you.** We act only on requests from the email address on the account. If you write from another address, we'll send a confirmation to the account's address first. We won't ask for ID documents unless there's no other way.
- **How long it takes.** We reply within 15 days. If we need longer, we'll tell you why within those 15 days and finish within 15 more.
- **Cost.** Free.

If you're unhappy with our answer, you can complain to your local data protection authority.

---

## 4. Edits to the published Privacy Policy and Cookies Policy

Each item quotes the current text exactly, then gives the replacement. Update "Last updated" on each page when you publish.

### 4.1 Privacy Policy §6: download claim

There's no download button in the web app yet (the API supports it: `GET /api/users/me/export`, once per UTC day).

**Current:**
> Download your data: in Account settings, get a file with your profile, polls, comments and votes (once a day).

**Replace with (until the button ships):**
> Get a copy of your data: email hello@vomatt.com from the address on your account, and we'll send you a file with your profile, settings, polls, comments, votes, follows, blocks, bookmarks and feedback.

**Variant (once the button ships):**
> Download your data: in Settings, get a file with your profile, settings, polls, comments, votes, follows, blocks, bookmarks and feedback (once a day). You can also ask us by email.

**Also in §6. Current:**
> Email hello@vomatt.com. You can also complain to your local data protection authority.

**Replace with:**
> Email hello@vomatt.com. We reply within 15 days; if we need longer, we'll tell you why within that time and finish within 15 more. See [Your data](/your-data) for how we check it's you. You can also complain to your local data protection authority.

### 4.2 Privacy Policy §3: anonymous unlinking timing

The unlinking runs in a daily job (04:30 UTC), not the moment a poll ends.

**Current:**
> Once the poll ends, we delete the link between an anonymous vote and the option chosen; only the totals remain.

**Replace with:**
> Within a day after the poll ends, we delete the link between an anonymous vote and the option chosen; only the totals remain.

### 4.3 Privacy Policy §5: deleted polls are kept

Deleted and moderator-removed polls are soft-deleted (hidden, kept in the database) until the creator's account is deleted.

**Current:**
> Deleted comments: hidden from everyone straight away. We keep the text until your account is deleted so we can handle reports about it.

**Replace with (two bullets):**
> - Deleted comments: hidden from everyone straight away. We keep the text until your account is deleted so we can handle reports about it.
> - Deleted or removed polls: hidden from everyone straight away. We keep the poll, with its votes and comments, until your account is deleted so we can handle reports about it.

**Also in §5. Current:**
> When you delete your account: everything is deleted immediately and permanently, including the polls you created together with the votes and comments others left on them. Your votes on other people’s polls are removed from their totals.

**Replace with:**
> When you delete your account: everything is deleted immediately and permanently, including the polls you created together with the votes and comments others left on them, and the replies others left under your comments. Your votes on other people’s polls are removed from their totals. Copies in our database provider's backups expire within [OWNER: N] days.

### 4.4 Privacy Policy §4: name processors and regions

**Current:**
> - Vercel: hosting for the website and our servers.
> - Neon: database storage for account and poll data.
> - An email delivery service: delivering sign-in codes, welcome emails and poll invitations.
> - A cache service: short-lived sign-in and rate-limit records.

**Replace with:**
> - Vercel (United States): hosting for the website and our servers, run in [OWNER: Vercel function region(s), e.g. Tokyo].
> - Neon (United States): database storage for account and poll data, in [OWNER: Neon region].
> - [OWNER: email provider name and country]: delivering sign-in codes, welcome emails and poll invitations. [OWNER: the API's default `MAIL_HOST` is smtp.gmail.com; confirm what production uses.]
> - [OWNER: cache provider name and country, i.e. whoever hosts production `REDIS_HOST`]: short-lived sign-in and rate-limit records, in [OWNER: region].

**Current:**
> Some providers process data outside your country, for example in the United States.

**Replace with:**
> Our providers store and process data in [OWNER: countries, e.g. Japan and the United States], which may be outside your country.

(Keep the following sentence about Standard Contractual Clauses as is.)

### 4.5 Cookies Policy: the `theme` storage entry

next-themes stores the chosen theme in local storage under the key `theme`.

**Current section "Other storage on your device", first bullet:**
> Poll drafts: polls you save as drafts are kept in your browser’s local storage (vomatt_poll_drafts). They never reach our servers and stay until you delete them or clear your browser data.

**Add a bullet after it:**
> - Theme: if you choose Light, Dark or Auto, your choice is kept in your browser’s local storage (theme). It never reaches our servers and stays until you change it or clear your browser data.

### 4.6 Terms of Service (same download claim; optional but recommended)

**Current (§9):**
> Download your data first if you want a copy.

**Replace with (until the button ships):**
> If you want a copy of your data, ask us for it first (see [Your data](/your-data)).

**Variant (once the button ships):**
> Download your data first in Settings if you want a copy.

**Current (§6):**
> If you see something that breaks these rules, report it from the poll or comment.

**Replace with:**
> If you see something that breaks these rules, report it from the poll or comment, or email us. See our [Community Guidelines](/community-guidelines) and [Reporting and appeals](/report).

---

## 5. Sign-up attestation (`pSignUp.policyMessage`)

**Current:**
> By signing up, you agree to the Terms of Service and Privacy Policy, including Cookie Use.

**Replace with** (keep the existing three link marks on the same words):
> By signing up, you confirm you’re 13 or older, with a parent’s or guardian’s permission if you’re under 18, and agree to the Terms of Service and Privacy Policy, including Cookie Use.

Chinese, if the sign-up message is ever localized:
> 註冊即表示你已年滿 13 歲（未滿 18 歲須經家長或監護人同意），並同意服務條款與隱私權政策，包括 Cookie 使用方式。

---

## 6. 繁體中文版本

### 6.1 社群守則

_Slug：`[OWNER: 例如 zh-community-guidelines]`_

# 社群守則

_最後更新：[OWNER: 日期]_

大家願意相信結果，vomatt 才有意義。這份守則說明建立投票、投票和留言時，我們對每個人的期待。守則與[服務條款](/terms-of-service)一起適用；兩者如有不一致，以服務條款為準。

## 歡迎這樣做

- 提出大家能表達看法的清楚問題：你住的街區、你的團隊、某個主題、一項公共決定。
- 針對公眾人物和組織的公開角色發起投票。
- 有理由地表達不同意見。說明自己為什麼這樣選的留言，是一個投票最有價值的部分。
- 把你的投票分享到任何地方，讓更多人參與。

## 不可以這樣做

**針對一般人的投票。** 未經當事人同意，不要發起點名、評分或評斷一般人（例如鄰居、同學或同事）的投票。

**揭露他人。** 不要公開別人的個人資料：真實姓名、地址、電話、工作地點、學校，或對方不公開的照片和帳號。不要用 @提及 或邀請把其他人引向某個人，也不要在提及某人時附上對方的個人資料。

**操弄投票。** 一人一個帳號、一個投票一票。不要使用分身帳號、程式或花錢買票。不要用好處換取特定選項的票。不要號召群眾湧入某個投票或留言區，藉此洗版或騷擾裡面的人。

**誤導性的公共議題投票。** 不要把投票包裝成正式的選舉、公投或官方調查，也不要冒用政府、政黨或候選人的名義。不要散布真實選舉中投票時間、地點或方式的錯誤資訊。vomatt 上的結果只反映參與的人，永遠不具官方效力。

**仇恨與騷擾。** 不得因種族、族裔、國籍、宗教、身心障礙、疾病、性別、性別認同、性傾向或年齡攻擊他人。不得威脅、霸凌，或一再糾纏不想被聯絡的人。

**性相關內容。** 不得發布露骨的性內容。任何涉及未成年人的性內容都絕對禁止：我們會移除內容、關閉帳號，並通報主管機關。

**違法內容。** 不得發布在台灣或你所在地違法的內容，包括詐騙、鼓吹暴力、販售管制物品，或侵害他人的著作權或商標權。

**垃圾訊息。** 不得刊登廣告、重複張貼，或寄邀請給不預期收到的人。

## 使用者名稱、顯示名稱與自我介紹

你的個人頁是公開的。名稱或自我介紹不得冒充他人或組織，不得含有歧視字眼或性內容，也不得包含他人的個人資料。頭像都從我們提供的角色中挑選，不需要上傳圖片。如果你的個人頁違反這些規定，我們會請你修改，修改前可能先將帳號停權。

## 違規時我們會怎麼做

我們會由真人查看發布的內容、可能造成的傷害，以及這個帳號過去的紀錄。通常我們會採取足以解決問題的最小措施：

1. 移除留言或投票。被移除的投票對所有人隱藏，即使已經有人投票。
2. 以電子郵件警告你。
3. 將帳號停權。停權期間，個人頁和投票都會隱藏。
4. 永久關閉帳號。

遇到嚴重傷害，例如威脅、揭露他人、涉及未成年人的性內容或大規模操弄投票，我們可能直接採取最後一步，並在法律要求時通報主管機關。

我們會告訴你做了什麼、為什麼，你也可以提出申訴。請見[檢舉與申訴](/report)。

## 封鎖

你可以在任何人的個人頁封鎖對方。封鎖後，對方的投票和留言不會再出現在你面前，對方也無法再開啟你的投票。對方不會收到通知。封鎖是為了保護你自己；如果對方同時違反守則，也請檢舉。

## 檢舉

登入的成員可以從投票或留言的選單檢舉。其他情況，或你沒有帳號，請寫信給我們。請見[檢舉與申訴](/report)。

---

### 6.2 檢舉與申訴

_Slug：`[OWNER: 例如 zh-report]`_

# 檢舉與申訴

_最後更新：[OWNER: 日期]_

如果 vomatt 上有內容違反[社群守則](/community-guidelines)或法律，請告訴我們。每一則檢舉都由真人閱讀。

## 在 App 內檢舉

登入後，打開投票或留言的選單，選擇「檢舉」，挑一個原因，需要的話再補充說明。我們不會告訴發布者是你檢舉的。

App 內檢舉目前只適用於投票和留言。要檢舉個人頁（使用者名稱、顯示名稱或自我介紹）或其他內容，請寫信給我們。

## 以電子郵件檢舉

不論有沒有帳號，任何人都可以寫信到 [hello@vomatt.com](mailto:hello@vomatt.com)，包括內容所涉及的當事人，以及對內容擁有權利的人。請在主旨寫「檢舉」，並附上：

- 投票或個人頁的連結；如果是留言，也請附上留言者的使用者名稱和留言開頭幾個字；
- 這則內容有什麼問題；如果你認為它違法，請說明違反哪條法律、原因為何；
- 你的姓名和電子郵件，方便我們回覆（檢舉涉及兒童的性內容時，可以不留姓名）；
- 一段聲明，表示你相信檢舉內容正確，且出於善意。

如果內容涉及你本人，請在信中說明，我們會優先處理。

## 著作權

如果你是 vomatt 上某項內容的權利人，或代表權利人，請寫信給我們，主旨寫「著作權」，並附上：

- 你的姓名、地址、電話和電子郵件；
- 你擁有權利的著作，以及原作可以在哪裡找到；
- 你認為侵權的內容連結；
- 一段聲明，表示你出於善意相信這項使用未經權利人、其代理人或法律允許；
- 一段聲明，表示通知內容正確，且你是權利人或有權代表權利人；
- 你的簽名（打出全名即可）。

我們會移除或停止顯示該內容，並通知發布者。為了讓對方回應，我們可能把你的通知（包括姓名和聯絡方式）轉交給對方。

[OWNER: 若 vomatt 服務美國使用者，請向美國著作權局登記 DMCA 指定代理人，並在此加上代理人資料。]

### 回復通知

如果你的內容因著作權通知被移除，而你認為是誤會，或你有權使用，請回覆我們的信，附上：你的姓名、地址、電話和電子郵件；被移除的內容和原本的位置；出於善意說明的理由；同意由 [OWNER: 法院，例如臺灣臺北地方法院] 管轄相關爭議；以及你的簽名。我們會把回復通知轉交給原通知人。如果對方在 10 個工作天內沒有告訴我們已提起訴訟，我們可能恢復該內容。

## 接下來會怎樣

- 電子郵件檢舉會在 [OWNER: 2] 個工作天內確認收到。
- 我們盡量在 [OWNER: 7] 天內做出決定。威脅、揭露個人資料和涉及未成年人的性內容會優先處理，並在 [OWNER: 24 小時] 內採取行動。
- 我們可能移除內容、保留內容，或依社群守則採取進一步措施。如果你是寫信檢舉，我們會告訴你結果。App 內檢舉不會個別回覆；如需回覆，請同時寫信給我們。

## 如果我們處理了你的內容或帳號

我們會寄信到你帳號的電子郵件，說明移除或變更了什麼、違反哪條規定或法律，以及如何申訴。所有決定都由真人做出。除了上面提到的著作權通知，我們不會告訴你是誰檢舉的。如果事先通知可能讓他人陷入危險，或法律不允許，我們可能不會先通知你。

## 申訴

如果你認為我們判斷錯了，請在 6 個月內回覆那封信，或寫信到 [hello@vomatt.com](mailto:hello@vomatt.com)，主旨寫「申訴」，告訴我們你認為我們忽略了什麼。我們會考量你的理由重新審查，並在 [OWNER: 14] 天內回覆。如果是我們錯了，會恢復內容或帳號。

你也可以向法院提起訴訟。如果你住在歐盟，也可以向經認證的訴訟外爭議解決機構提出。

---

### 6.3 你的資料

_Slug：`[OWNER: 例如 zh-your-data]`_

# 你的資料

_最後更新：[OWNER: 日期]_

這一頁說明 vomatt 保存了你的哪些資料，以及如何取得副本、修改或刪除。完整內容請見[隱私權政策](/privacy-policy)。

## 我們保存什麼

- **你的電子郵件**，用來登入；如果你新增了通行密鑰，我們只保存公開金鑰。
- **你的個人資料：** 使用者名稱、顯示名稱、自我介紹、頭像，以及你自行填寫的姓名、生日和所在地。
- **你的活動：** 你建立的投票、投下的票、留言、按讚、收藏、追蹤、封鎖、邀請名單、檢舉和意見回饋。
- **安全紀錄：** 你登入或變更帳號時的 IP 位址和瀏覽器類型，保存 180 天。

我們不會出售你的資料，也不會拿來投放廣告。

## 取得副本

請用帳號的電子郵件寫信到 [hello@vomatt.com](mailto:hello@vomatt.com)，主旨寫「資料請求」。我們會寄給你一份檔案，內含你的個人資料、設定、投票（包括已刪除的）、留言、選票、追蹤、封鎖、收藏、追蹤的主題和意見回饋。

[OWNER: 設定頁的按鈕上線後，把上一段換成：「在設定中選擇『下載你的資料』，即可立即取得檔案，每天可下載一次。你也可以寫信向我們索取。」]

如果你想要檔案裡沒有的資料，例如安全紀錄，請來信詢問，我們會告訴你保存了哪些。

## 修改或更正

- 隨時在設定中編輯你的個人資料。
- 選擇每一項個人資料誰能看到，以及是否預設匿名投票。
- 投票進行中，你可以更改或撤回你的選票。
- 要變更帳號的電子郵件，請用目前的電子郵件寫信給我們，告訴我們新的地址。我們會先確認新地址，再為你變更。

## 刪除

- **留言：** 從留言選單刪除。留言會立即對所有人隱藏。為了處理相關檢舉，我們會保留內容到你的帳號刪除為止。
- **投票：** 投票排程中，或建立後 20 分鐘內可以刪除。刪除後會立即隱藏，但投票連同選票和留言會保留到你的帳號刪除為止。
- **帳號：** 在設定中刪除。刪除會立即生效，無法復原，並會移除：
  - 你的個人資料、電子郵件、通行密鑰、追蹤、封鎖、收藏和邀請名單；
  - 你投下的票，並從各投票的總數中扣除；
  - 你的留言，以及其他人在你留言下的回覆；
  - 你建立的投票，連同其他人在上面的選票和留言；
  - 你的檢舉和意見回饋。

  你在安全紀錄中的資料會去識別化。[OWNER: 資料庫備份中的副本會在 N 天內失效；請確認 Neon 的還原保留期間後填入。]

## 匿名投票

匿名投票時，你的名字不會出現在投票者名單中。投票結束後一天內，我們會刪除你的選票與所選選項之間的連結，連我們也看不到你選了什麼，只會留下總數。

## 依個資法提出的請求

依照台灣《個人資料保護法》、歐盟 GDPR 及類似法律，你可以要求查詢或閱覽你的資料、取得副本、更正、刪除，或要求我們停止蒐集或利用。請寫信到 [hello@vomatt.com](mailto:hello@vomatt.com)。

- **確認身分。** 我們只處理從帳號電子郵件寄出的請求。如果你用其他地址來信，我們會先寄確認信到帳號的電子郵件。除非沒有其他辦法，我們不會要求你提供身分證件。
- **處理時間。** 我們會在 15 天內回覆。如果需要更多時間，會在這 15 天內告訴你原因，並在之後 15 天內完成。
- **費用。** 免費。

如果你對我們的回覆不滿意，可以向你所在地的個人資料保護主管機關申訴。
