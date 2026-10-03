# Operating the paid audit

The site sells exactly one thing: a one-time manual GEO audit at **USD 199**. There
is no checkout, deliberately — the customer emails, and everything after that is a
person reading pages and writing them up.

This file is the process that `/pricing/`, `/refund/` and `/withdrawal/` already
promise. **If you change the process, change those pages in the same commit.** A
page that describes a process you do not run is worse than a page that says
nothing, because the customer and any reviewer will rely on it.

---

## Where an order starts

Nowhere automated. There are two entry points and both are mailto links:

- `/pricing/` → "Request an audit →" (subject line pre-filled)
- `/contact/` → "Request an audit", one of four routes

Both land in the address declared in `lib/site.ts` (currently
`alex.xu@ccie13192.com`). There is no cart, no account, and no payment page on the
site. Do not add a price to the site that the emails contradict.

---

## The five steps

### 1. Inbound request

The customer sends the pages they want reviewed. If they have not said which pages,
ask before going further — the scope is "up to 5 pages", and the quote depends on it.

### 2. Scope note — **before any money changes hands**

Reply with the four facts (scope, price, delivery time, method link) **and** the
withdrawal notice **and** the model withdrawal form **and** the express-consent
question. Template A below is this email.

This is the step that carries the legal weight. `/withdrawal/` states that this
notice reaches the consumer in text form before the contract is concluded, that
nothing is charged until they agree the scope, and that if they want the 48-hour
turnaround you ask explicitly whether you may begin before the 14 days are up. All
three of those things happen here or nowhere.

### 3. Confirmation

You need two answers, and it is worth asking for them as two separate lines so the
record is unambiguous:

1. "Scope confirmed" — plus any change to the page list.
2. **Only if they want delivery inside 14 days:** explicit agreement to begin early
   plus confirmation that they understand the right of withdrawal is lost by doing
   so. If they decline, either wait out the 14 days or proceed and remember that the
   right survives until it expires on its own.

### 4. Payment link

Send a link for **USD 199, one-time**. Any provider works; the difference that
matters is whether they are a merchant of record:

| Option | Who handles EU VAT |
| --- | --- |
| Paddle, Creem, Lemon Squeezy (merchant of record) | The provider does |
| Stripe Payment Link, PayPal invoice | You do |

Nobody has resolved the VAT question yet (see the note at the bottom). Until it is
resolved, a merchant of record is the option that does not quietly create a
registration obligation in every EU member state you sell into.

### 5. Delivery

Deliver the PDF within 48 hours of payment. Then keep the paper trail for the order:
the request, your scope note, their confirmation, and their answer on starting early.
`/withdrawal/` explicitly states that the answer is kept on file, so keep it.

---

## Templates

### A. Scope note (sent before payment)

> **Subject:** Your LLMention GEO audit — scope, price, and your right of withdrawal
>
> Hi <name>,
>
> Thanks for the request. Here is exactly what I would do, what it costs, and what
> your rights are before you pay anything.
>
> **Scope**
> - Pages: up to 5, at the URLs you sent. Tell me if that list should change.
> - What you get: a human review of each page against the published method, a
>   prioritised fix list, and drafted `robots.txt`, `llms.txt` and JSON-LD ready to
>   paste. Delivered as a PDF.
> - Delivery: within 48 hours of payment.
> - Price: USD 199, one-time. Not a subscription; nothing recurring is charged.
> - Method: every check and its weight are published, so you can see how any score
>   is produced: https://geo-scanner.ccie13192.com/methodology/
>
> **Payment**
> Reply to confirm the scope and I will send a payment link. Nothing is charged
> before you agree to this.
>
> ---
> **Your right of withdrawal (consumers in the EU and the UK)**
>
> You have the right to withdraw from the contract within fourteen days without
> giving any reason. The period runs from the day the contract was concluded.
>
> To withdraw, send me an unambiguous statement — email is enough — to
> alex.xu@ccie13192.com. You may use the form below but you are not obliged to.
> Sending the statement before the period expires is sufficient.
>
> If you withdraw, I refund every payment received without undue delay and at the
> latest within fourteen days of your withdrawal reaching me, using the same means
> of payment, and you are charged no fee for the refund. If you asked me to begin
> work during the fourteen days, you owe a proportionate amount for the part already
> performed when you told me you were withdrawing.
>
> The right lapses early only if the service has been fully performed, I began with
> your express consent, and you confirmed at the same time that you understood you
> would lose the right by letting me begin. Until you give that consent, the right
> survives even after work has started.
>
> **Model withdrawal form**
> To: Xiaodong Xu — alex.xu@ccie13192.com
> I/We hereby give notice that I/We withdraw from my/our contract for the provision
> of the following service:
> Ordered on / received on:
> Name of consumer(s):
> Address of consumer(s):
> Signature (only if notified on paper):
> Date:
> (Delete as appropriate.)
> ---
>
> **Starting early (optional)**
> The 48-hour turnaround falls inside the fourteen days. If you want that, I need
> your explicit agreement to begin before the period ends and your confirmation that
> you understand you lose the right of withdrawal by letting me begin. You do not
> have to agree — I can start after the fourteen days instead, or you can withdraw at
> any time during them.
>
> **Please reply with:**
> 1. "Scope confirmed" (plus any change to the page list)
> 2. Only if you want the 48-hour turnaround: "I agree that you may begin before the
>    withdrawal period ends, and I understand that I lose the right of withdrawal."
>
> Separately, and regardless of the above: if the audit finds nothing actionable on
> your pages, the full price is refunded. That promise is voluntary and comes on top
> of your statutory rights. https://geo-scanner.ccie13192.com/refund/

### B. Payment link

> **Subject:** Payment link — LLMention GEO audit
>
> Here is the payment link: <link>
>
> Amount: USD 199, one-time. You will receive a receipt from <provider>.
>
> I start on receipt and deliver within 48 hours. Your scope confirmation and your
> answer on starting early are on file.

### C. Delivery

> **Subject:** Your GEO audit — <domain>
>
> Attached is the audit. It covers <n> pages: <list>.
>
> If anything is unclear, or you disagree with a specific check, reply and say which
> one — the method is published precisely so a disagreement can be specific, and a
> wrong check gets fixed rather than argued about.
>
> Reminder: if this found nothing actionable on the pages you submitted, reply within
> 14 days and it is refunded in full.

---

## Open items that touch this file

- **EU VAT has not been resolved.** The price is quoted in USD and no tax is
  stated. If you register for VAT in any form, the price line in template A has to
  say whether tax is included, and the site has to match it. A merchant of record
  avoids the whole question.
- **The withdrawal notice is in English.** That is consistent with an English-only
  site, but a consumer's right is theirs regardless of the language they read. If a
  meaningful share of buyers turns out to be German-speaking, the notice needs a
  German version again — and at that point an Impressum probably does too, which
  means a postal address, which means making this repository private first (see the
  note in `lib/legal-entity.ts`).
