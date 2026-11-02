# 第 3 輪實測修正檢查報告

日期：2026-11-01
對象：`vomatt-test-issues.md` 中尚未勾選的項目
程式版本：vomatt-web `main` @ `fe6ef80`（#85 Fix round-3 QA issues）

`fe6ef80` 在第 3 輪實測之後才提交，所以第 3 輪的結果反映不到這批修正。10/31 的 #81、#82、#83 在實測之前就已經上線，第 3 輪的結果已經涵蓋它們。

驗證範圍：逐項讀程式碼與 diff，並對照 `api-docs.json`。`jest src/__tests__/features` 全數通過（53 個 suite、664 個測試），`tsc --noEmit` 沒有錯誤。**這次沒有在瀏覽器裡實際重現**，所以下文標「待 r4 回歸」的項目都還需要第 4 輪實測確認。

---

## 1. 本輪已修，待第 4 輪回歸

| 項目 | 修正內容 | 判斷 |
|---|---|---|
| R2 #1、A2 頁首留言數 | 投票卡的 Comments 數和 Discussion 共用同一個計數（`thread.total`） | 已修。兩邊不會再對不上。取捨見 §5-2 |
| A3 /explore 卡片留言數 | 卡片已不顯示留言數 | 建議關閉 |
| R2 #6、R2 B3 已投選項顯示未選 | 每張卡片的 radio 包在各自的 `<form>` 裡，不再和其他副本共用同一個 radio group | 修法無害，也有測試。**但根因沒有證實**，見 §5-1。列為 r4 重點 |
| N1、R2 #4、C6 Voted 分頁少 1 | Voted 分頁納入 `myOptionId` 為 null、`myBallotAnonymous` 有值的投票（匿名票在投票結束後會被封存），顯示「你以匿名投票」 | 已修，和 API 契約一致（`VoteResponse.myBallotAnonymous`：「still set when myOptionId is null because the caller's Anonymous Ballot was sealed」） |
| N6 改票文案 | 改票時顯示「Vote updated. / 已更新投票。」，登入前在別處投過的票也算 | 已修 |
| N8 編輯留言 Cmd+Enter | 加上 Cmd/Ctrl+Enter 儲存，並防止重複送出 | 已修 |
| R1 A4「Replying」與「Reply」並存 | 按鈕固定顯示「Reply」，狀態只由 `aria-pressed` 表達 | 已修 |
| N11 相對時間進位 | 投票頁的「N days ago」改成無條件捨去，和通知頁一致 | 已修 |
| N2 建立表單底部列擋住按鈕 | `sm` 以上的 `scroll-padding-bottom` 加大 | **部分修正**，見 §5-3 |
| R2 B2 標題念兩次 | 選項群組的名稱改成「Options / 選項」，不再引用標題 | 已修 |

---

## 2. 已在 10/31 修正，第 3 輪沒測到

| 項目 | 狀態 |
|---|---|
| R2 #7 回覆草稿消失 | #82 已修，草稿會跟著回覆框移動。剩一個邊角情況：原本那則留言從列表消失後（重排或重新載入），草稿會被清掉。這是刻意的行為 |
| R2 #13 匿名票的投票者彈窗 | #82 已修。有投票者的選項被隱藏時，標題改成「Who voted」並附說明。剩一個小缺口：第一頁資料載入前，標題還是選項名加「N voted」。r3 因為無法結束公開投票而沒測到，r4 要用 unlisted 或邀請制投票補測 |
| R2 C5 @提及自動完成 | #83 已上線（`MentionTextarea`）。建議關閉 |

---

## 3. 不需修改，建議關閉或改為「設計如此」

| 項目 | 理由 |
|---|---|
| R1 B1 按讚後 aria-label 仍是「Like」 | 切換按鈕的正確寫法就是固定 label 加上 `aria-pressed`。可以選擇性改進：目前 `aria-label` 蓋掉了按讚數，螢幕閱讀器聽不到數字 |
| N3 Hide/Show my name 沒有 aria-pressed | 這是「動作按鈕，label 隨狀態改變」的寫法，旁邊還有 `role="status"` 播報狀態，本身是合法的。如果加上 `aria-pressed` 又保留會變的 label，反而是錯的。如果團隊想要 toggle 語意，就改成固定 label「Hide my name」加 `aria-pressed` |
| N4 「ABOUT THIS POLL」多出「x」 | 程式在 Opened 和 Results 之間只渲染一個進度條（`Progress`），沒有任何文字節點。推測是 agent 擷取文字造成的假象。需要截圖才能確認 |
| R1 B4 通知卡片整張是連結、重複的「Create a poll」 | 整張卡片的連結是 `aria-hidden`、`tabIndex=-1`，只給滑鼠用，不影響無障礙。重複的「Create a poll」分別來自桌面側邊欄和手機 TabBar，沒用到的那份是 `display:none`，輔助技術讀不到，只有文字擷取工具會看到兩份 |
| R1 A6、R2 #14 輸入 1 字仍顯示預設列表 | 刻意的設計（#82）：字數不足時不送出搜尋，顯示提示並保留列表。如果產品希望清空列表，改動很小 |
| R1 A7 Ended 時 Sort 消失 | 刻意的設計：API 不接受已結束投票的排序參數，所以 Sort 列設為 invisible，但保留位置 |
| N5 自己的回覆收進「View N more replies」 | API 預設只預覽最舊的 2 則回覆，所以是設計使然。UX 上可以改進，見 §4 |
| N12 voted in 與公開預覽差 1 | 匿名票不計入公開數，屬預期 |
| R1 A9、R2 #7 | r3 未遇到，r4 再遇到才重開 |

---

## 4. 本次追加修正（尚未提交、尚未在瀏覽器驗證）

| 項目 | 原因 | 修法 |
|---|---|---|
| **N10** 通知連結帶上 `?tab=conversation` | `NotificationList.changeCategory` 在 `await getNotifications()` 之後才讀 `window.location.href`。請求回來前點了通知，`?tab=` 就會寫到投票頁上 | 在 await 之前先記下網址；請求回來時如果已經不在通知頁，就不改網址 |
| **N9** 從通知按 Reply 沒打開回覆框 | Reply 和整列的連結相同，`useCommentLink` 只會捲動 | Reply 改連到 `#reply-<留言>[/<回覆>]`（新增 `replyHash`）。`useCommentLink` 捲到留言後回傳回覆對象，`CommentThread` 打開回覆框。一般 `#comment-` 連結的行為不變 |
| **N13** 追蹤後 following 數沒變 | `followUser`、`unfollowUser` 沒有讓快取失效 | 兩個 action 都呼叫 `revalidateTag(PROFILES_TAG, { expire: 0 })`，雙方個人頁的數字都會更新 |
| **N14** 回覆通知寫「made the case under …」 | COMMENT 同時涵蓋「留言在你的投票」和「回覆你的留言」 | 留言有 `parentId` 時改用「{name} replied in {title} / {name} 在 {title} 回覆了留言」。**沒有寫成「回覆你」**：API 只給 `parentId`，投票擁有者也會收到別人之間的回覆，前端分辨不出是不是回覆自己。如果想寫「replied to you」，需要 API 在通知裡加上被回覆者 |
| **R2 #12** 最後一個選項按 Enter 沒反應 | 已有空白選項時，Enter 直接什麼都不做 | Enter 改走和「Add option」按鈕同一條路：聚焦空白選項並顯示「Fill in every option.」 |

每項都補了測試，並確認拿掉修正後測試會失敗。全部 1299 個測試通過，`tsc` 和 ESLint 沒有錯誤。

仍待決定：

| 項目 | 說明 |
|---|---|
| **N7** /explore 人數沒更新 | 刻意設計：列表快取 30 秒，投票只讓單一投票的快取失效（`service.ts` 的 `invalidatePoll` 註解有寫原因）。要決定接受 30 秒延遲，還是在卡片上用前端補正人數。不建議每票都清列表快取 |
| **N5**（選做） | 送出後記住這則回覆的 id，重新整理前持續顯示 |
| B1 加分項（選做） | `aria-label` 帶上按讚數 |

---

## 5. 需要團隊再想想

1. **R2 #6 / B3 的根因還沒證實。** commit 的說法是頁面串流載入時，文件裡同時有兩份卡片，兩組 radio 互相取消勾選。但檢查後：Suspense 的 fallback 是 skeleton，沒有 radio；`cacheComponents` 也沒開，Next 不會用 `<Activity>` 保留舊頁面。所以目前找不到「第二份卡片」從哪來。包一層 form 能防止這類問題，但如果真正原因不是這個，r4 可能還會偶發。
   11/2 在本機 stack（headless Chromium）重現失敗，**包含拿掉 form 的版本**：
   - 投票頁直接改票後重新整理 3 次、Feed 卡片改票後點進投票頁再重新整理 2 次、上一頁／下一頁：勾選都正確，頁面上只有一組 radio（3 個），找不到第二份卡片。
   - 選了別的選項但沒按 Update vote 就重新整理：瀏覽器沒有還原表單狀態，顯示的是已存的票。所以「瀏覽器還原表單」也不是原因，不加 `autoComplete="off"`。
   - 登入者的 `getPoll` 是 `no-store`，API 也沒有快取，伺服器不會回舊的 `myOptionId`。
   結論：兩個假設都排除，不再做推測性修改，form 保留（無害）。**r4 如果再遇到，請附**：瀏覽器與版本、截圖、從哪個頁面進來、重新整理前有沒有點了選項卻沒按 Update vote，以及 `document.querySelectorAll('input[type=radio]')` 的數量和 `.checked`。
2. **留言數改成「一致」而不是「即時」。**（已決定：維持一致，不做即時）現在頁首和 Discussion 都只加自己的操作，別人的新留言兩邊都要重新整理才看得到。之前頁首會算進別人的留言，反而造成不一致。即時需要輪詢或推播，每個開著的投票頁都會持續打 API，目前不值得。
3. **N2 的修法只解決了一半。**（已補修，尚未提交）`scroll-padding` 只影響聚焦或 `scrollIntoView` 時的捲動位置。現在底部列設為 `pointer-events: none`，只有按鈕本身可點，捲到底部列下方的欄位可以直接點到。已在 1280×782 的視窗驗證：同一個點在修正前命中底部列，修正後命中「Add option」。
4. **產品待定項目已累積 15 項以上**（見 §6），建議開一次產品會議集中決定，不要每輪重複列出。
5. **測試流程。** A11、N4、B4 和部分 N2 都是 agent 擷取文字或環境造成的假象。建議 r4 要求每則回報附截圖和視窗尺寸，並在文件裡分開標示「agent 環境問題」。

---

## 6. 產品決定（11/2）

要改（尚未提交）：

- R1 C1、R2 C10：結果除了百分比，也顯示各選項票數（例如「27 votes · 64%」）。API 的 `voteCount` 本來就有，只是前端沒顯示
- R1 C3、R2 C9：拿掉 `/my-polls`，改回 404，不再導向個人頁。`/create` 維持 404（「This profile doesn't exist」，因為 `create` 符合帳號格式）。另見下方「404 狀態碼」

設計如此，關閉：

- R1 C5：結束時間預設最短 1 小時
- R1 C7 後半：可以對自己的留言按讚
- R2 C2：回覆別人的回覆時，不自動帶入 @，改用「Replying to X」標籤
- R2 C4：留言裡的網址不轉成連結。每則留言可以複製自己的連結（`#comment-…`）
- R2 C6：邀請制投票在所有受邀者投完後提前結束
- R2 C7、N15：公開投票不能提前結束，只能跑到截止時間
- R2 C8：Enter 換行，Cmd+Enter 才送出

仍待決定：

- R1 C4：回覆的縮排在不同 agent 看到的結果不同（建議 r4 截圖確認）
- R2 C3：Tag。API 已支援 `tagIds`（最多 5 個），schema 也有，但建立表單沒有 tag 選擇器，首頁也沒有 tag 篩選。屬於功能等級的工作
- R1 A6 / R2 #14、N7：見上文
- **404 狀態碼**：`74c0cc3` 在 `(frontend)` layout 加了 `<Suspense fallback={<BrandPulse />}>`，頁面在 `notFound()` 之前就開始串流，所以不存在的帳號和投票現在回 HTTP 200，頁面內容是「找不到」並帶 `noindex`（soft 404，Next 文件的既定行為）。使用者看到的一樣，搜尋引擎也不會收錄。要回真正的 404，就得拿掉這層 Suspense（失去首次載入的 BrandPulse），或在 proxy 先查帳號是否存在（每次開個人頁多一次 API 請求）

---

## 7. 第 4 輪回歸清單

1. 改票後連續重新整理兩次，選項的勾選狀態、`.checked` 和 AX tree 都正確（R2 #6、B3）
2. 兩個帳號同時在同一則投票留言，頁首和 Discussion 的數字一致（R2 #1）
3. 匿名投票並等投票結束，Voted 分頁列出這則投票，「polls voted in」和分頁數量一致（N1）
4. 改票時顯示「Vote updated.」（N6）
5. 編輯留言時按 Cmd+Enter 會儲存，連按也只存一次（N8）
6. 在 782px 高的視窗打開建立表單，讓 Add option 捲到底部列下方後直接點擊（N2）
7. 用 unlisted 或邀請制投票加匿名票，結束後打開投票者彈窗（R2 #13）
8. 螢幕閱讀器念到標題一次，選項群組念作「Options」（R2 B2）
9. 在通知頁切換分頁，立刻點一則通知，投票頁網址沒有 `?tab=`（N10）
10. 從通知按 Reply，打開投票頁時回覆框已經打開，回覆別人的回覆時帶入「Replying to」（N9）
11. 追蹤別人後回到自己的個人頁，following +1（N13）
12. 別人回覆我的留言，通知寫「replied in …」（N14）
13. 已有空白選項時，在最後一個選項按 Enter，焦點跳到空白選項並顯示錯誤（R2 #12）
