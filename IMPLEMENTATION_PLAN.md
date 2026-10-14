# API 2026-10-14: Audience, Invitees, Groups, Delete, Deadline

Contract: `api-docs.json` (= `vomatt-api` `docs/frontend/openapi.json`, CHANGELOG 2026-10-14).

## Stage 1: Data layer
**Goal**: Schemas and Server Actions for the new contract.
**Success Criteria**: Poll parses `audience`, `deadline`, `deletable`, `inviteeCount`; create/edit send `audience` and Invitee lists; `deletePoll`, invitee and group actions exist; `sort=top`; user search returns public fields; mark-read ignores `vote.not_found`; a Ballot that auto-ends the Poll is reported.
**Tests**: service tests for request bodies/paths, groups service, invitees, search, notifications.
**Status**: Not Started

## Stage 2: Poll lifecycle UI
**Goal**: Owner can Delete (Scheduled, or within the delete window) and End now (Open Unlisted / Invite-only); "Ended early" shows the Deadline; Audience and invitee count show on the card and detail; invitations get marked read and appear in Notifications.
**Success Criteria**: Cancel is gone; Public Polls offer no End now; Ballots that end the Poll switch to Results.
**Tests**: OwnerActions, PollCard/PollAbout, status helpers, NotificationList.
**Status**: Not Started

## Stage 3: Creator audience + invitees
**Goal**: Audience picker; Invite-only adds users (search), emails and Groups; edit prefills current Invitees; owners manage Invitees of an Open Poll.
**Success Criteria**: Request carries `audience`, `inviteeIds`, `inviteeEmails`, `groupIds`; old drafts still load.
**Tests**: PollCreator, InviteePicker, InviteeManager.
**Status**: Not Started

## Stage 4: Groups tab on Account
**Goal**: Create, rename, delete Groups and manage members.
**Tests**: GroupsPanel.
**Status**: Not Started

## Stage 5: Explore "Most voted" + docs
**Goal**: `sort=top` pill; update `docs/release/api-integration-notes.md`.
**Status**: Not Started
