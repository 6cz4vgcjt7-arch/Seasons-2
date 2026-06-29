(function(){
  const APP_VERSION="v1.3.1";
  const APP_BUILD=131;
  let updateInfo=null;
  let versionTapCount=0;
  let data=window.CCStorage.load();
  const UI=window.SeasonsUI;
  const E=window.CCEngine;
  const screens={command:UI.byId("command"),review:UI.byId("review"),accounts:UI.byId("accounts"),history:UI.byId("history"),settings:UI.byId("settings"),onboarding:UI.byId("onboarding")};

  const SEASONS={
    establish:{icon:"🌱",name:"Establish",line:"Build your financial foundation.",description:"Plant the seeds for a lifetime of financial confidence."},
    grow:{icon:"☀️",name:"Grow",line:"Increase your financial strength.",description:"Cultivate consistent habits that build long-term wealth."},
    steward:{icon:"🍂",name:"Steward",line:"Use your resources with intention.",description:"Care wisely for the life you've built and the people you love."},
    preserve:{icon:"❄️",name:"Preserve",line:"Protect your financial independence.",description:"Preserve what you've built so it can continue supporting your life and the people who matter most."}
  };
  function season(id){return SEASONS[id]||SEASONS.establish;}
  function setSeason(id){const s=season(id);const changed=data.seasonId&&data.seasonId!==id;data.seasonId=id;data.seasonName=s.name;if(changed||!data.seasonSince)data.seasonSince=new Date().toLocaleDateString(undefined,{month:"long",year:"numeric"});}
  function accountKind(account){return E.accountKind?E.accountKind(account):"debt";}
  function isDebt(account){return accountKind(account)==="debt";}
  function isFoundation(account){return accountKind(account)==="foundation";}
  function isRetirement(account){return String(account?.type||"").toLowerCase().includes("retirement");}
  function accountIcon(account){if(isFoundation(account))return isRetirement(account)?"☀️":"🌱";return "";}
  function commandReflection(){
    const id=data.seasonId||"establish";
    const f=focus();
    const notices=patternNotices(false);
    const due=dueFutureChanges();
    const promoReminders=duePromoReminders();
    const reviewComplete=data.review?.status==="complete";
    const pools={
      establish:[
        "Building your foundation creates options later.",
        "Stability is built by returning each week.",
        "A steady foundation can carry more than a rushed one.",
        "Small corrections today make next month easier."
      ],
      grow:[
        "Consistency compounds over time.",
        "Growth is often quiet before it becomes visible.",
        "The habits you repeat become the capacity you rely on.",
        "What you strengthen now can serve future seasons."
      ],
      steward:[
        "Small decisions today shape tomorrow.",
        "Stewardship begins with noticing what has been entrusted to you.",
        "Wise management often looks like calm attention.",
        "Resources become more useful when they have a purpose."
      ],
      preserve:[
        "Protecting what you've built creates lasting freedom.",
        "Preservation is an active form of care.",
        "What you protect today can support tomorrow's family.",
        "A quiet plan can carry a long legacy."
      ]
    };
    if(promoReminders.length)return "A promotional rate is on the horizon. Planning ahead creates more options.";
    if(due.length)return "Something on the horizon is ready for your attention.";
    if(notices.length)return "A pattern is asking for a closer look this week.";
    if(f&&isDebt(f))return "Every intentional payment creates room for what comes next.";
    if(f&&isFoundation(f))return "Foundations grow through ordinary weeks faithfully reviewed.";
    if(reviewComplete)return "Your week has been reviewed. Let the next decision be a thoughtful one.";
    const list=pools[id]||pools.establish;
    const idx=Math.abs(String(new Date().toDateString()+id).split("").reduce((sum,ch)=>sum+ch.charCodeAt(0),0))%list.length;
    return list[idx];
  }
  function seasonWelcome(id){
    if(id==="establish")return "Every new chapter begins by strengthening the foundation beneath it.";
    if(id==="grow")return "The work you did in Establish made this season possible.";
    if(id==="steward")return "Your growing resources can now support broader priorities.";
    if(id==="preserve")return "This season is about protecting the independence you've worked to build.";
    return "What matters is recognizing what deserves your attention today.";
  }
  function seasonInfo(id){
    const info={
      establish:{mission:"Build stability.",attention:["Emergency fund", "High-interest debt", "Predictable weekly habits"],reflection:"What can make next month easier?"},
      grow:{mission:"Increase capacity.",attention:["Retirement contributions", "Investing consistency", "Long-term wealth building"],reflection:"Which investment today benefits future you most?"},
      steward:{mission:"Manage wisely.",attention:["Family goals", "529 savings", "Intentional use of resources"],reflection:"What has been entrusted to you?"},
      preserve:{mission:"Protect what you've built.",attention:["Financial independence", "Legacy planning", "Risk reduction"],reflection:"How can today's decisions help tomorrow's family?"}
    };
    return info[id]||info.establish;
  }
  function recommendSeason(){
    const answers=data.onboarding?.answers||{};
    const scores={establish:0,grow:0,steward:0,preserve:0};
    Object.values(answers).forEach(value=>{if(scores[value]!==undefined)scores[value]+=1;});
    const best=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0]?.[0]||"establish";
    data.onboarding.recommendedSeason=best;
    return best;
  }


  function save(){window.CCStorage.save(data);}
  function saveRender(screen="command"){save();render(screen);}
  function activeAccounts(){return E.activeAccounts(data);}
  function completedAccounts(){return E.completedAccounts(data);}
  function focus(){return E.focusAccount(data);}
  function betaMode(){return Boolean(data.betaMode);}
  function betaReviewDateValue(){return (data.review&&data.review.reviewDate)||new Date().toISOString().slice(0,10);}
  function betaDefaultReviewDate(){
    const snapshots=(data.snapshots||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
    const last=snapshots[snapshots.length-1]?.date;
    if(last){const d=new Date(last);d.setDate(d.getDate()+7);return d.toISOString().slice(0,10);}
    return new Date().toISOString().slice(0,10);
  }

  function weekRangeLabel(dateValue){
    const base=dateValue?new Date(dateValue):new Date();
    const d=new Date(base.getFullYear(),base.getMonth(),base.getDate());
    const day=d.getDay();
    const mondayOffset=(day+6)%7;
    const start=new Date(d);
    start.setDate(d.getDate()-mondayOffset);
    const end=new Date(start);
    end.setDate(start.getDate()+6);
    const sameYear=start.getFullYear()===end.getFullYear();
    const sameMonth=start.getMonth()===end.getMonth() && sameYear;
    const fmtStart=sameMonth?{month:"long",day:"numeric"}:sameYear?{month:"long",day:"numeric"}:{month:"long",day:"numeric",year:"numeric"};
    const fmtEnd=sameYear?{month:sameMonth?undefined:"long",day:"numeric"}:{month:"long",day:"numeric",year:"numeric"};
    const startText=start.toLocaleDateString(undefined,fmtStart);
    const endText=end.toLocaleDateString(undefined,fmtEnd);
    return `${startText} – ${endText}`;
  }
  function nextReviewDate(){
    const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const target=days.indexOf(data.reviewDay||"Thursday");
    const today=new Date();
    const d=new Date(today.getFullYear(),today.getMonth(),today.getDate());
    if(target<0)return d;
    let diff=target-d.getDay();
    if(diff<0)diff+=7;
    const next=new Date(d);
    next.setDate(d.getDate()+diff);
    return next;
  }
  function reviewRhythmStatus(){
    const status=data.review?.status;
    if(status==="complete")return betaMode()?"Test review completed":"Weekly Review completed";
    if(status==="inProgress")return "Weekly Review in progress";
    if(status==="allUpdated")return "Ready to close this week";
    const next=nextReviewDate();
    const today=new Date();
    const startToday=new Date(today.getFullYear(),today.getMonth(),today.getDate());
    const diff=Math.round((next-startToday)/86400000);
    if(diff===0)return "Weekly Review ready today";
    if(diff===1)return "Weekly Review due tomorrow";
    return `${diff} days until Weekly Review`;
  }

  function reviewTimestamp(){
    if(betaMode() && data.review?.reviewDate){return new Date(`${data.review.reviewDate}T12:00:00`).toISOString();}
    return new Date().toISOString();
  }
  function monthlyInterestEstimate(account){
    if(!account || !isDebt(account))return 0;
    const apr=E.effectiveApr?E.effectiveApr(account):Number(account.apr)||0;
    return (Number(account.balance)||0)*(apr/100)/12;
  }
  function payoffMonthsEstimate(account,extra=0){
    if(!account || !isDebt(account))return null;
    const balance=Number(account.balance)||0;
    const payment=(Number(account.min)||0)+Number(extra||0);
    const apr=E.effectiveApr?E.effectiveApr(account):Number(account.apr)||0;
    if(balance<=0 || payment<=0)return null;
    const r=(apr/100)/12;
    if(r<=0)return Math.ceil(balance/payment);
    if(payment<=balance*r)return null;
    return Math.ceil(-Math.log(1-(r*balance/payment))/Math.log(1+r));
  }
  function futureChangeFocusProjection(change){
    const f=focus();
    if(!change || !f || !isDebt(f))return "";
    const amount=allocationAmountForFocus(change);
    if(amount<=0)return "";
    const currentMonths=payoffMonthsEstimate(f,0);
    if(currentMonths===null)return "";
    let projectedMonths=null;
    if(change.frequency==="oneTime"){
      const projectedBalance=Math.max(0,(Number(f.balance)||0)-amount);
      projectedMonths=payoffMonthsEstimate({...f,balance:projectedBalance},0);
      if(projectedBalance===0)projectedMonths=0;
    }else{
      projectedMonths=payoffMonthsEstimate(f,amount);
    }
    if(projectedMonths===null)return "";
    const weeksSaved=Math.max(0,Math.round((currentMonths-projectedMonths)*4.345));
    if(weeksSaved<=0)return `Directing ${change.frequency==="oneTime"?UI.money(amount):`+${UI.money(amount)}/month`} toward ${f.name} could shorten the payoff, but Seasons needs more payment history to estimate the exact timing.`;
    const amountText=change.frequency==="oneTime"?UI.money(amount):`+${UI.money(amount)}/month`;
    return `Directing ${amountText} toward ${f.name} could pay it off about ${weeksSaved} week${weeksSaved===1?"":"s"} sooner.`;
  }
  function promoReminderTimingLabel(days){
    const n=Number(days)||30;
    return `${n} day${n===1?"":"s"} before`;
  }
  function promoReminderIsDue(account){
    if(!account || !isDebt(account) || !account.promoEnabled || !account.promoReminderEnabled || !account.promoExpires)return false;
    const days=E.daysUntil?E.daysUntil(account.promoExpires):null;
    const windowDays=Number(account.promoReminderDays)||30;
    return days!==null && days>=0 && days<=windowDays;
  }
  function duePromoReminders(){
    return activeAccounts().filter(promoReminderIsDue).sort((a,b)=>(E.daysUntil(a.promoExpires)||9999)-(E.daysUntil(b.promoExpires)||9999));
  }
  function promoReminderMessage(account){
    const days=E.daysUntil?E.daysUntil(account.promoExpires):null;
    const when=days===0?"today":days===1?"tomorrow":`in ${days} days`;
    return `Your promotional APR on ${account.name} ends ${when}. If paying this down before the standard APR returns is still your plan, this may deserve attention this week.`;
  }
  function horizonItems(limit=4){
    const items=[];
    upcomingFutureChanges(365).forEach(change=>items.push({
      date:change.date,
      title:change.title||changeTypeLabel(change.type),
      meta:`${UI.prettySnapshotDate(change.date)} • ${change.frequency==="oneTime"?UI.money(change.amount):`+${UI.money(change.amount)}/mo`}`,
      action:"showFutureChangeDetail",
      id:change.id,
      kind:"change"
    }));
    activeAccounts().forEach(account=>{
      if(account.promoEnabled && account.promoReminderEnabled && account.promoExpires){
        const days=E.daysUntil?E.daysUntil(account.promoExpires):null;
        if(days!==null && days>=0 && days<=Math.max(Number(account.promoReminderDays)||30,90)){
          items.push({
            date:account.promoExpires,
            title:`${account.name} promo APR ends`,
            meta:`${days===0?"Today":days+" days"} • standard APR ${Number(account.standardApr||account.apr||0).toFixed(2)}%`,
            action:"showAccountDetail",
            id:account.id,
            kind:"promo"
          });
        }
      }
    });
    return items.sort((a,b)=>new Date(a.date||"2999-12-31")-new Date(b.date||"2999-12-31")).slice(0,limit);
  }

  function focusReason(account){
    if(!account)return completedAccounts().length?"All active accounts are complete. Keep the weekly habit alive.":"Add an account so Seasons can choose what deserves attention this week.";
    if(isFoundation(account))return "This foundation supports the season you are in right now.";
    const promo=account.promoEnabled && account.promoExpires ? E.weeklyReviewsUntil(account.promoExpires) : null;
    if(promo!==null && promo>=0 && promo<=12)return `Promotional APR expires in ${promo} week${promo===1?"":"s"}. This deserves attention before the standard APR returns.`;
    if(data.strategy==="snowball")return "This is your smallest active balance. Completing it can simplify your monthly cash flow.";
    return "Every extra dollar sent here saves more interest than your other active debts.";
  }
  function focusReasonDetails(account){
    if(!account)return ["No active focus account has been selected yet."];
    if(isFoundation(account)){
      return ["This is a foundation account, so progress means building rather than paying down.", `It aligns with your current season: ${season(data.seasonId).name}.`];
    }
    const details=[];
    const debts=activeAccounts().filter(isDebt);
    const apr=E.effectiveApr?E.effectiveApr(account):Number(account.apr)||0;
    const highestApr=Math.max(...debts.map(a=>E.effectiveApr?E.effectiveApr(a):Number(a.apr)||0),0);
    const smallestBalance=Math.min(...debts.map(a=>Number(a.balance)||0),Number(account.balance)||0);
    if(data.strategy==="snowball" && Number(account.balance)<=smallestBalance)details.push("It is your smallest active debt, which can simplify monthly cash flow once completed.");
    if(data.strategy!=="snowball" && apr>=highestApr)details.push("It has the highest effective APR among your active debts.");
    if(account.promoEnabled && account.promoExpires){
      const weeks=E.weeklyReviewsUntil(account.promoExpires);
      if(weeks!==null)details.push(`Its promotional APR expires in ${weeks} week${weeks===1?"":"s"}.`);
    }
    const planned=activeFutureChanges().filter(change=>allocationAmountForFocus(change)>0);
    if(planned.length)details.push(`${planned.length} item${planned.length===1?" is":"s are"} on the horizon for this account.`);
    details.push(`It aligns with your current season: ${season(data.seasonId).name}.`);
    return details;
  }

  function futureChanges(){data.futureChanges=data.futureChanges||[];return data.futureChanges.filter(change=>!change.archived).sort((a,b)=>new Date(a.date||"2999-12-31")-new Date(b.date||"2999-12-31"));}
  function activeFutureChanges(){return futureChanges().filter(change=>change.status!=="complete");}
  function changeTypeLabel(type){const labels={monthlyIncrease:"Monthly capacity",expenseEnding:"Expense ending",debtPayoff:"Debt payoff",bonus:"Bonus or windfall",incomeIncrease:"Income increase",other:"Horizon item"};return labels[type]||labels.other;}
  function changeFrequencyLabel(change){return change.frequency==="oneTime"?"One-time":"Monthly";}
  function futureChangeAllocations(change){
    const raw=Array.isArray(change?.allocations)?change.allocations.filter(a=>Number(a.value)>0):[];
    if(raw.length)return raw;
    if(change?.destinationAccountId)return [{target:`acct:${change.destinationAccountId}`,mode:"percent",value:100}];
    if(change?.destination==="Current Focus Account")return [{target:"focus",mode:"percent",value:100}];
    if(change?.destination&&change.destination!=="Decide later")return [{target:change.destination,mode:"percent",value:100}];
    return [];
  }
  function allocationTargetLabel(target){
    if(!target)return "Decide later";
    if(target==="focus")return "Current Focus Account";
    if(target.startsWith&&target.startsWith("acct:")){const account=(data.accounts||[]).find(a=>a.id===target.slice(5));return account?account.name:"Selected account";}
    return target;
  }
  function futureChangeDestination(change){
    const allocations=futureChangeAllocations(change);
    if(!allocations.length)return "Decide later";
    return allocations.map(a=>{
      const label=allocationTargetLabel(a.target);
      const value=Number(a.value)||0;
      const amount=allocationAmount(change,a);
      const suffix=a.mode==="amount"?UI.money(amount):`${value}%`;
      return `${label} (${suffix})`;
    }).join(", ");
  }
  function allocationAmount(change,allocation){
    const total=Number(change?.amount)||0;
    const value=Number(allocation?.value)||0;
    if(value<=0)return 0;
    if(allocation?.mode==="amount")return Math.min(value,total||value);
    return total*(value/100);
  }
  function allocationAmountForFocus(change){
    const f=focus();
    if(!f)return 0;
    return futureChangeAllocations(change).reduce((sum,a)=>{
      const target=a.target||"";
      const pointsToFocus=target==="focus" || target===`acct:${f.id}`;
      return pointsToFocus?sum+allocationAmount(change,a):sum;
    },0);
  }
  function futureChangeIsDue(change){if(!change.date || change.status==="complete")return false;const due=new Date(change.date+"T23:59:59");return due<=new Date();}
  function dueFutureChanges(){return activeFutureChanges().filter(futureChangeIsDue);}
  function upcomingFutureChanges(days=90){const now=new Date();const end=new Date();end.setDate(end.getDate()+days);return activeFutureChanges().filter(change=>{if(!change.date)return false;const d=new Date(change.date+"T12:00:00");return d>=now && d<=end;});}
  function futureCapacitySummary(){const changes=activeFutureChanges();const monthly=changes.filter(c=>c.frequency!=="oneTime").reduce((sum,c)=>sum+(Number(c.amount)||0),0);const oneTime=changes.filter(c=>c.frequency==="oneTime").reduce((sum,c)=>sum+(Number(c.amount)||0),0);return {monthly,oneTime,count:changes.length,due:dueFutureChanges().length,upcoming:upcomingFutureChanges(90).length};}
  function nextFutureChange(){return activeFutureChanges().find(change=>change.date)||null;}
  function redirectLine(change){const destination=futureChangeDestination(change);if(destination==="Decide later")return "Seasons will ask how you want to use this capacity when it arrives.";return `Planned direction: ${destination}.`;}
  function show(screen){UI.showScreen(screen);UI.setActiveNav(screen==="onboarding"?"command":screen);}

  function render(screen){
    if(!data.setupComplete){renderOnboarding();show("onboarding");return;}
    renderCommand();renderReview();renderAccounts();renderHistory();renderSettings();show(screen);
  }

  function renderOnboarding(){
    data.onboarding=data.onboarding||{step:"welcome",answers:{},recommendedSeason:"establish"};
    const step=data.onboarding.step||"welcome";
    const answers=data.onboarding.answers||{};
    if(step==="welcome"){
      screens.onboarding.innerHTML=`
        <div class="topbar"><div class="brand">SEASONS</div>${UI.cycle(0,"tiny")}</div>
        <div class="title">Every financial life has seasons.</div>
        <p class="sub">Seasons helps you build lasting financial achievements through one intentional weekly habit.</p>
        <div class="card"><div class="label">The Weekly Practice</div><div class="value">Observe. Reflect. Progress.</div><p class="sub">Your season may change. Your weekly habit remains the same.</p></div>
        <button class="btn" data-action="startSeasonReflection">Begin</button>`;
      return;
    }
    if(step==="discover"){
      screens.onboarding.innerHTML=`
        <div class="topbar"><div class="brand">SEASONS</div>${UI.cycle(0,"tiny")}</div>
        <div class="screenTitle">Discover Your Current Season</div>
        <p class="sub">A short reflection to help choose your current focus. Seasons recommends. You decide.</p>
        <div class="card seasonQuestion"><div class="label">What feels like your highest financial priority today?</div>
          <select id="seasonQ1"><option value="establish" ${answers.q1==="establish"?"selected":""}>Build a stronger financial foundation</option><option value="grow" ${answers.q1==="grow"?"selected":""}>Grow my wealth</option><option value="steward" ${answers.q1==="steward"?"selected":""}>Use my resources more intentionally</option><option value="preserve" ${answers.q1==="preserve"?"selected":""}>Protect what I've built</option></select>
        </div>
        <div class="card seasonQuestion"><div class="label">Which statement sounds most like you?</div>
          <select id="seasonQ2"><option value="establish" ${answers.q2==="establish"?"selected":""}>I want less financial stress.</option><option value="grow" ${answers.q2==="grow"?"selected":""}>I want my money to grow.</option><option value="steward" ${answers.q2==="steward"?"selected":""}>I want greater confidence in my financial decisions.</option><option value="preserve" ${answers.q2==="preserve"?"selected":""}>I want to know what I've built will last.</option></select>
        </div>
        <div class="card seasonQuestion"><div class="label">Which achievement would have the greatest impact over the next few years?</div>
          <select id="seasonQ3"><option value="establish" ${answers.q3==="establish"?"selected":""}>Eliminate high-interest debt or build stability</option><option value="grow" ${answers.q3==="grow"?"selected":""}>Invest consistently and build long-term wealth</option><option value="steward" ${answers.q3==="steward"?"selected":""}>Balance home, family, and major decisions</option><option value="preserve" ${answers.q3==="preserve"?"selected":""}>Protect financial independence for the future</option></select>
        </div>
        <button class="btn" data-action="recommendCurrentSeason">Continue</button>`;
      return;
    }
    if(step==="recommendation"){
      const rec=season(data.onboarding.recommendedSeason||recommendSeason());
      screens.onboarding.innerHTML=`
        <div class="topbar"><div class="brand">SEASONS</div>${UI.cycle(1,"tiny")}</div>
        <div class="screenTitle">Based on your reflections...</div>
        <div class="card seasonCard selectedSeason"><div class="seasonIcon">${rec.icon}</div><div><div class="value">${rec.name}</div><div class="sub">${rec.line}</div><p class="sub">${rec.description}</p></div></div>
        <p class="sub center">Does this feel like the right current focus?</p>
        <button class="btn" data-action="acceptSeasonRecommendation">Continue</button>
        <button class="btn secondary" data-action="chooseAnotherSeason">Choose Another Season</button>`;
      return;
    }
    if(step==="chooseSeason"){
      screens.onboarding.innerHTML=`
        <div class="topbar"><div class="brand">SEASONS</div>${UI.cycle(1,"tiny")}</div>
        <div class="screenTitle">Choose Your Current Season</div>
        <p class="sub">Financial seasons are periods of focus, not levels to complete.</p>
        <div class="seasonGrid">${Object.entries(SEASONS).map(([id,s])=>`<button class="seasonCard ${data.seasonId===id?"selectedSeason":""}" data-action="selectSeason" data-season="${id}"><span class="seasonIcon">${s.icon}</span><span><b>${s.name}</b><span class="sub">${s.line}</span></span></button>`).join("")}</div>`;
      return;
    }
    screens.onboarding.innerHTML=`
      <div class="topbar"><div class="brand">SEASONS</div>${UI.cycle(2,"tiny")}</div>
      <div class="screenTitle">Build Your Weekly Review</div>
      <p class="sub">Set a simple weekly appointment. You can change this later.</p>
      <div class="card"><div class="label">Current Season</div><div class="value">${season(data.seasonId).icon} ${UI.escapeHtml(data.seasonName)}</div><div class="sub">${season(data.seasonId).line}</div></div>
      <div class="card">
        <div class="label">Weekly Review</div>
        <select id="setupDay"><option ${data.reviewDay==="Thursday"?"selected":""}>Thursday</option><option ${data.reviewDay==="Sunday"?"selected":""}>Sunday</option><option ${data.reviewDay==="Monday"?"selected":""}>Monday</option><option ${data.reviewDay==="Tuesday"?"selected":""}>Tuesday</option><option ${data.reviewDay==="Wednesday"?"selected":""}>Wednesday</option><option ${data.reviewDay==="Friday"?"selected":""}>Friday</option><option ${data.reviewDay==="Saturday"?"selected":""}>Saturday</option></select>
        <input id="setupTime" value="${UI.escapeHtml(data.reviewTime||"7:30 PM")}" placeholder="Review time">
      </div>
      <div class="card">
        <div class="label">Focus Strategy</div>
        <select id="setupStrategy"><option value="avalanche" ${data.strategy==="avalanche"?"selected":""}>Highest Interest First</option><option value="snowball" ${data.strategy==="snowball"?"selected":""}>Smallest Balance First</option></select>
      </div>
      <button class="btn" data-action="finishSetup">Begin Seasons</button>`;
  }

  function renderCommand(){
    const f=focus();
    const reviewComplete=data.review?.status==="complete";
    const progress=E.progressStatus(data);
    const seasonalSignal=seasonalChangeSignal();
    const capacity=futureCapacitySummary();
    const upcoming=upcomingFutureChanges(365).slice(0,3);
    const due=dueFutureChanges();
    const promoReminders=duePromoReminders();
    const horizon=horizonItems(4);
    const notices=patternNotices(false);
    const primaryNotice=notices[0];
    const seasonObj=season(data.seasonId);
    const reviewStatus=reviewComplete?"Complete":data.review?.status==="inProgress"?"In progress":data.review?.status==="allUpdated"?"Ready to close":"Ready";
    const weekLabel=weekRangeLabel(betaMode()?betaReviewDateValue():undefined);
    const rhythmStatus=reviewRhythmStatus();
    const reviewSub=reviewComplete?"This week has been reviewed.":data.review?.status==="inProgress"?"Continue where you left off.":`${data.reviewDay} • ${data.reviewTime}`;
    const upcomingMarkup=horizon.length?horizon.map(item=>`<button class="briefTimelineItem tappable" data-action="${item.action}" data-id="${item.id}"><span><b>${UI.escapeHtml(item.title)}</b><small>${UI.escapeHtml(item.meta)}</small></span><span class="miniChev">›</span></button>`).join(""):`<button class="briefTimelineItem tappable" data-action="showFutureChangeForm"><span><b>Nothing new on the horizon</b><small>Add a bonus, raise, expense ending, promo reminder, or future redirect.</small></span><span class="miniChev">›</span></button>`;
    const focusSub=f?focusReason(f):focusReason(null);
    const seasonalCard=seasonalSignal?`<div class="briefSection seasonalNotice tappable" role="button" tabindex="0" data-action="beginSeasonalChange"><div class="briefKicker">We've noticed</div><div class="briefValue">A seasonal change</div><p>${UI.escapeHtml((seasonalSignal.reasons||[])[0]||"Seasons may be asking you to reconsider what deserves attention now.")}</p><span class="briefLink">Reflect first →</span></div>`:"";
    const patternCard=primaryNotice?`<div class="briefSection patternBrief tappable" role="button" tabindex="0" data-screen="review"><div class="briefKicker">Pattern noticed</div><p>${UI.escapeHtml(primaryNotice.message)}</p></div>`:"";
    const promoCard=promoReminders.length?`<div class="briefSection futureDue tappable" role="button" tabindex="0" data-action="showAccountDetail" data-id="${promoReminders[0].id}"><div class="briefKicker">We've noticed</div><div class="briefValue">Promotional APR ending</div><p>${UI.escapeHtml(promoReminderMessage(promoReminders[0]))}</p></div>`:"";
    const dueCard=due.length?`<div class="briefSection futureDue tappable" role="button" tabindex="0" data-action="showFutureChanges"><div class="briefKicker">We've noticed</div><div class="briefValue">Something on the horizon arrived</div><p>${UI.escapeHtml(due[0].title||changeTypeLabel(due[0].type))} is ready for a decision.</p></div>`:"";
    screens.command.innerHTML=`
      <div class="thisWeekPageTitle">This Week</div>
      <div class="thisWeekLogo">${UI.cycle(0,"tiny")}</div>
      <div class="thisWeekReflection">${UI.escapeHtml(commandReflection())}</div>
      ${updateInfo?`<div class="updateBanner"><div><b>New version available</b><div class="sub">${UI.escapeHtml(updateInfo.version || "Update")}</div></div><button class="smallBtn" data-action="reloadUpdate">Reload</button></div>`:""}
      <div class="thisWeekTitle">${UI.escapeHtml(data.reviewDay||new Date().toLocaleDateString(undefined,{weekday:"long"}))}</div>
      <div class="thisWeekDate">${UI.escapeHtml(weekLabel)}</div>
      <p class="thisWeekLead">${UI.escapeHtml(rhythmStatus)} · What deserves your attention right now.</p>
      ${seasonalCard}
      ${promoCard}
      ${dueCard}
      <div class="briefSection tappable" role="button" tabindex="0" data-action="showSeasonDetail">
        <div class="briefKicker">Current Season</div>
        <div class="briefValue">${seasonObj.icon} ${UI.escapeHtml(data.seasonName)}</div>
        <p>${UI.escapeHtml(seasonObj.line)} Since ${UI.escapeHtml(data.seasonSince)}. ${UI.escapeHtml(progress)}</p>
      </div>
      <div class="briefSection tappable" role="button" tabindex="0" data-action="showFocusDetail">
        <div class="briefKicker">Current Focus</div>
        <div class="briefValue">${f?UI.escapeHtml(f.name):completedAccounts().length?"Season Complete":"Add Account"}</div>
        <p>${UI.escapeHtml(focusSub)}</p>
        ${f?`<div class="briefMetric"><span>Current balance</span><strong>${UI.money(f.balance)}</strong></div>${isDebt(f)?`<div class="briefMetric"><span>Estimated monthly interest</span><strong>${UI.money(monthlyInterestEstimate(f))}</strong></div>`:""}<button class="inlineWhy" data-action="showFocusWhy">Why am I seeing this?</button>`:""}
      </div>
      <div class="briefSection">
        <div class="briefKicker">On the Horizon</div>
        <div class="briefTimeline">${upcomingMarkup}</div>
        ${(capacity.monthly||capacity.oneTime)?`<div class="briefMetric"><span>Planned capacity</span><strong>${capacity.monthly?`+${UI.money(capacity.monthly)}/mo`:""}${capacity.monthly&&capacity.oneTime?" • ":""}${capacity.oneTime?`${UI.money(capacity.oneTime)} one-time`:""}</strong></div>`:""}
      </div>
      ${patternCard}
      <div class="briefSection reviewBrief tappable" role="button" tabindex="0" data-action="startReview">
        <div class="briefKicker">Weekly Review</div>
        <div class="briefValue">${reviewStatus}</div>
        <p>${UI.escapeHtml(rhythmStatus)}. ${UI.escapeHtml(reviewSub)}</p>
        <button class="btn compactBtn" data-action="startReview">${data.review?.status==="inProgress"?"Continue Review":data.review?.status==="allUpdated"?"Close Week":reviewComplete?"View This Week":"Begin Review"}</button>
      </div>`;
  }

  function reviewAccounts(){return E.reviewOrder(data);}
  function promoSummary(account){
    if(!account?.promoEnabled)return "";
    const apr=`${Number(account.promoApr||0).toFixed(2)}% promo`;
    if(!account.promoExpires)return apr;
    const reviews=E.weeklyReviewsUntil(account.promoExpires);
    return reviews===null?apr:`${apr}, ${reviews} week${reviews===1?"":"s"} left`;
  }

  function accountDelta(account,newBalance){
    const previous=Number(account?.balance)||0;
    const current=Number(newBalance)||0;
    return isDebt(account) ? previous-current : current-previous;
  }

  function changeLine(delta,account){
    const amount=UI.money(Math.abs(delta));
    if(delta>0)return `<div class="changeLine good">${isDebt(account)?"↓":"↑"} ${amount} since last review</div>`;
    if(delta<0)return `<div class="changeLine attention">${isDebt(account)?"↑":"↓"} ${amount} since last review</div>`;
    return `<div class="changeLine neutral">No meaningful change</div>`;
  }

  function balanceSeriesForAccount(account, includeDraft=true){
    const entries=(data.snapshots||[])
      .map(snapshot=>{const found=(snapshot.accounts||[]).find(item=>item.id===account.id);return found?{date:snapshot.date,balance:Number(found.balance)||0}:null;})
      .filter(Boolean)
      .sort((a,b)=>new Date(a.date)-new Date(b.date));
    if(includeDraft && data.review?.draft && data.review.draft[account.id]!==undefined){
      entries.push({date:new Date().toISOString(),balance:Number(data.review.draft[account.id])||0,current:true});
    }
    return entries;
  }

  function trendForAccount(account, includeDraft=true){
    const series=balanceSeriesForAccount(account,includeDraft);
    const recent=series.slice(-5);
    if(recent.length<3)return {status:"insufficient",message:"Balance pattern will appear after a few Weekly Reviews.",offTrackCount:0,intervals:0};
    const intervals=[];
    for(let i=1;i<recent.length;i++){
      const before=recent[i-1].balance;
      const after=recent[i].balance;
      const change=after-before;
      const meaningful=Math.abs(change)>=1;
      let good=false;
      let flat=false;
      if(isDebt(account)){good=meaningful && change<0; flat=!meaningful;}
      else{good=meaningful && change>0; flat=!meaningful;}
      intervals.push({change,good,flat,offTrack:!good});
    }
    const offTrackCount=intervals.filter(i=>i.offTrack).length;
    const movingAwayCount=intervals.filter(i=>isDebt(account)?i.change>0:i.change<0).length;
    const flatCount=intervals.filter(i=>i.flat).length;
    const last=intervals[intervals.length-1];
    const status=offTrackCount>=3?"attention":last.good?"good":last.offTrack?"watch":"neutral";
    let message="";
    if(status==="attention"){
      if(isDebt(account)){
        message=movingAwayCount>=2?`${account.name} has moved away from your payoff goal across several reviews.`:`${account.name} has not meaningfully decreased across several reviews.`;
      }else if(isRetirement(account)){
        message=movingAwayCount>=2?`${account.name} has decreased across several reviews.`:`${account.name} has been mostly flat across several reviews.`;
      }else{
        message=movingAwayCount>=2?`${account.name} has been used for several reviews. This may mean Establish needs more attention.`:`${account.name} has not grown across several reviews.`;
      }
    }else if(status==="watch"){
      message=isDebt(account)?`${account.name} did not move in the payoff direction this review.`:`${account.name} did not move in the building direction this review.`;
    }else if(status==="good"){
      message=isDebt(account)?`${account.name} is moving in the payoff direction.`:`${account.name} is moving in the building direction.`;
    }else{
      message="No clear pattern yet.";
    }
    return {status,message,offTrackCount,flatCount,movingAwayCount,intervals:intervals.length};
  }

  function patternNotices(includeDraft=true){
    const notices=[];
    reviewAccounts().forEach(account=>{
      const trend=trendForAccount(account,includeDraft);
      if(trend.status==="attention"){
        notices.push({accountId:account.id,label:account.name,message:trend.message,kind:"attention",offTrackCount:trend.offTrackCount});
      }
    });
    const promo=E.soonestPromo(data);
    if(promo && promo.reviewsRemaining!==null && promo.reviewsRemaining<=8){
      const account=data.accounts.find(a=>a.id===promo.id)||promo;
      const trend=trendForAccount(account,includeDraft);
      if(trend.status!=="good"){
        notices.push({accountId:promo.id,label:promo.name,message:`${promo.name} promo expires in ${promo.reviewsRemaining} week${promo.reviewsRemaining===1?"":"s"}, and the balance is not falling consistently yet.`,kind:"attention",offTrackCount:trend.offTrackCount||0});
      }
    }
    const unique=[];const seen=new Set();
    notices.forEach(n=>{const key=n.accountId+":"+n.message;if(!seen.has(key)){seen.add(key);unique.push(n);}});
    return unique.slice(0,4);
  }

  function weeklyObservations(){
    const accounts=reviewAccounts();
    const draft=data.review?.draft||{};
    const observations=[];
    const f=focus();
    if(f && draft[f.id]!==undefined){
      const delta=accountDelta(f,draft[f.id]);
      observations.push({label:"Focus Account",value:delta>0?`${isDebt(f)?"↓":"↑"} ${UI.money(delta)}`:delta<0?`${isDebt(f)?"↑":"↓"} ${UI.money(Math.abs(delta))}`:"No meaningful change",kind:delta>0?"good":delta<0?"attention":"neutral"});
    }
    const debtAccounts=accounts.filter(isDebt);
    const foundationAccounts=accounts.filter(isFoundation);
    const previousDebt=E.totalBalance(debtAccounts);
    const currentDebt=debtAccounts.reduce((sum,a)=>sum+(draft[a.id]!==undefined?Number(draft[a.id])||0:Number(a.balance)||0),0);
    const debtDelta=previousDebt-currentDebt;
    if(debtAccounts.length)observations.push({label:"Debt Progress",value:debtDelta>0?`↓ ${UI.money(debtDelta)}`:debtDelta<0?`↑ ${UI.money(Math.abs(debtDelta))}`:"No meaningful change",kind:debtDelta>0?"good":debtDelta<0?"attention":"neutral"});
    const previousFoundations=E.totalBalance(foundationAccounts);
    const currentFoundations=foundationAccounts.reduce((sum,a)=>sum+(draft[a.id]!==undefined?Number(draft[a.id])||0:Number(a.balance)||0),0);
    const foundationDelta=currentFoundations-previousFoundations;
    if(foundationAccounts.length)observations.push({label:"Foundations",value:foundationDelta>0?`↑ ${UI.money(foundationDelta)}`:foundationDelta<0?`↓ ${UI.money(Math.abs(foundationDelta))}`:"No meaningful change",kind:foundationDelta>0?"good":foundationDelta<0?"attention":"neutral"});
    const notices=patternNotices(true);
    if(notices.length)observations.push({label:"Pattern Noticed",value:`${notices.length} account${notices.length===1?"":"s"}`,kind:"attention"});
    const promo=E.soonestPromo(data);
    if(promo && promo.reviewsRemaining!==null && promo.reviewsRemaining<=8){
      observations.push({label:"Upcoming",value:`${UI.escapeHtml(promo.name)} promo expires in ${promo.reviewsRemaining} week${promo.reviewsRemaining===1?"":"s"}`,kind:"neutral"});
    }
    return observations.slice(0,4);
  }

  function weeklyReflectionSentence(observations){
    const patternObs=observations.find(o=>o.label==="Pattern Noticed");
    const focusObs=observations.find(o=>o.label==="Focus Account");
    const promoObs=observations.find(o=>o.label==="Upcoming");
    if(patternObs)return "A pattern is emerging across several reviews. This is a good week to decide whether the plan still fits.";
    if(focusObs?.kind==="good")return "Your Focus account moved in the right direction this week.";
    if(focusObs?.kind==="attention")return "Your Focus account moved away from your intention this week. A short note can help explain the pattern later.";
    if(promoObs)return "A promotional APR is approaching. Planning ahead gives you more options.";
    return "Your review is complete and your records are current.";
  }


  function latestReviewDate(){
    const snapshots=(data.snapshots||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
    return snapshots[snapshots.length-1]?.date||"";
  }

  function seasonalPriorityLabel(id){
    const labels={establish:"Building stability",grow:"Growing wealth",steward:"Managing wisely",preserve:"Protecting the future"};
    return labels[id]||labels.establish;
  }

  function accountKindByType(type){
    const value=String(type||"").toLowerCase();
    return value.includes("emergency")||value.includes("retirement")?"foundation":"debt";
  }

  function seasonalChangeSignal(){
    const snapshots=(data.snapshots||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
    const minReviews=betaMode()?4:8;
    if(snapshots.length<minReviews)return null;
    const recent=snapshots.slice(-Math.max(minReviews,4));
    const dismissed=data.seasonalChange?.dismissedReviewDate;
    const newest=recent[recent.length-1]?.date||"";
    if(dismissed && newest && new Date(dismissed).getTime()>=new Date(newest).getTime())return null;

    const totals=recent.map(snapshot=>{
      let debt=0;let foundation=0;
      (snapshot.accounts||[]).forEach(item=>{
        const balance=Number(item.balance)||0;
        if(item.paidOff)return;
        if(accountKindByType(item.type)==="foundation")foundation+=balance;else debt+=balance;
      });
      return {date:snapshot.date,debt,foundation};
    });
    const first=totals[0];
    const last=totals[totals.length-1];
    const debtChange=last.debt-first.debt;
    const foundationChange=last.foundation-first.foundation;
    const activeDebt=activeAccounts().filter(isDebt).reduce((sum,a)=>sum+(Number(a.balance)||0),0);
    const attention=patternNotices(false).length;
    const current=data.seasonId||"establish";
    const reasons=[];
    let suggested=null;
    let tone="forward";

    if(current!=="establish" && (debtChange>250 || foundationChange<-250 || attention>=2)){
      suggested="establish";tone="return";
      if(debtChange>250)reasons.push("Debt balances have increased across several reviews.");
      if(foundationChange<-250)reasons.push("Foundation balances have been used across several reviews.");
      if(attention>=2)reasons.push("Several accounts are asking for attention at the same time.");
    }else if(current==="establish" && (activeDebt<=0 || debtChange<-500) && foundationChange>=0 && attention===0){
      suggested="grow";
      if(activeDebt<=0)reasons.push("High-interest debt is no longer the main pressure point.");
      else reasons.push("Debt has been moving steadily in the right direction.");
      reasons.push("Your foundation has remained steady or continued to build.");
    }else if(current==="grow" && activeDebt<=0 && foundationChange>500 && attention===0){
      suggested="steward";
      reasons.push("Debt is no longer competing for your attention.");
      reasons.push("Your foundation has continued to strengthen across several reviews.");
    }else if(current==="steward" && activeDebt<=0 && foundationChange>=0 && attention===0 && totals.length>=12){
      suggested="preserve";
      reasons.push("Your resources have remained stable across a longer season.");
      reasons.push("Protection and legacy may deserve more attention soon.");
    }
    if(!suggested || suggested===current)return null;
    return {current,suggested,tone,reasons:reasons.slice(0,3),reviewDate:newest,reviewCount:recent.length};
  }

  function renderSeasonalChangeIntro(){
    const signal=seasonalChangeSignal();
    if(!signal){renderSeasonDetail();return;}
    const current=season(signal.current);
    const suggested=season(signal.suggested);
    screens.command.innerHTML=`
      <div class="reviewHeader"><button class="back" data-action="backToCommand">‹</button><div class="reviewTitle">Seasonal Change</div><span></span></div>
      <div class="card quietMessage"><div class="label">We've noticed a seasonal change.</div><div class="value smallValue">Your financial patterns may be asking for different attention.</div><p class="sub">This isn't a promotion or a setback. Seasons change because life changes.</p></div>
      <div class="card"><div class="label">Over the past several reviews</div>${signal.reasons.map(reason=>`<p class="sub">• ${UI.escapeHtml(reason)}</p>`).join("")}</div>
      <div class="card"><div class="label">Before Seasons makes a recommendation...</div><div class="value smallValue">What feels most important right now?</div><div class="accountList seasonChoiceList">${Object.entries(SEASONS).map(([id,s])=>`<button class="settingChoice" data-action="answerSeasonalPriority" data-value="${id}" data-suggested="${signal.suggested}"><span><b>${UI.escapeHtml(seasonalPriorityLabel(id))}</b><span class="sub">${s.icon} ${UI.escapeHtml(s.name)}</span></span><span class="miniChev">›</span></button>`).join("")}</div></div>
      <button class="btn secondary" data-action="dismissSeasonalChange">Not now</button>`;
    show("command");
  }

  function renderSeasonalChangeRecommendation(priority,suggestedId){
    const signal=seasonalChangeSignal()||{current:data.seasonId||"establish",suggested:suggestedId||"establish",reasons:[]};
    const suggested=season(suggestedId||signal.suggested);
    const current=season(signal.current);
    const aligned=priority===suggestedId;
    screens.command.innerHTML=`
      <div class="reviewHeader"><button class="back" data-action="beginSeasonalChange">‹</button><div class="reviewTitle">Seasonal Change</div><span></span></div>
      <div class="card seasonDetailHero"><div class="seasonIcon bigSeason">${suggested.icon}</div><div><div class="label">Suggested Season</div><div class="value">${UI.escapeHtml(suggested.name)}</div><p class="sub">Based on both your financial patterns${priority?` and your reflection`:""}, this may be the season that deserves attention now.</p></div></div>
      <div class="card quietMessage"><div class="label">Seasons change.</div><p class="sub">The goal isn't to stay in one forever. The goal is to recognize what deserves your attention today.</p>${aligned?`<p class="sub"><b>Your reflection points the same direction.</b></p>`:`<p class="sub">Your reflection matters. If ${UI.escapeHtml(current.name)} still feels right, stay there.</p>`}</div>
      <button class="btn" data-action="enterSuggestedSeason" data-season="${suggestedId||signal.suggested}">Enter ${UI.escapeHtml(suggested.name)}</button>
      <button class="btn secondary" data-action="keepCurrentSeason">Continue in ${UI.escapeHtml(current.name)}</button>`;
    show("command");
  }


  function renderSeasonDetail(){
    const id=data.seasonId||"establish";
    const current=season(id);
    screens.command.innerHTML=`
      <div class="reviewHeader"><button class="back" data-action="backToCommand">‹</button><div class="reviewTitle">Current Season</div><span></span></div>
      <div class="card seasonDetailHero tappableCard" role="button" tabindex="0" data-action="showSeasonInfo" data-season="${id}"><div class="seasonIcon bigSeason">${current.icon}</div><div><div class="label">Current Financial Season</div><div class="value">${UI.escapeHtml(current.name)}</div><div class="sub">${UI.escapeHtml(current.line)}</div><p class="sub">Tap to learn what this season is asking you to notice.</p></div><div class="chev">›</div></div>
      <div class="card quietMessage"><div class="value">Seasons change.</div><p class="sub">The goal isn't to stay in one forever. The goal is to recognize what deserves your attention today.</p></div>
      <div class="sectionLabel">The Four Financial Seasons</div>
      <div class="accountList">${Object.entries(SEASONS).map(([sid,s])=>`<div class="accountRow ${sid===data.seasonId?"selectedSeasonRow":""}" data-action="showSeasonInfo" data-season="${sid}"><div class="accountMeta"><div>${s.icon} ${UI.escapeHtml(s.name)}</div><div class="sub">${UI.escapeHtml(s.line)}</div></div><div class="row">${sid===data.seasonId?'<span class="check miniCheck">✓</span>':''}<span class="miniChev">›</span></div></div>`).join("")}</div>`;
    show("command");
  }

  function renderSeasonInfo(id){
    const s=season(id);
    const info=seasonInfo(id);
    screens.command.innerHTML=`
      <div class="reviewHeader"><button class="back" data-action="showSeasonDetail">‹</button><div class="reviewTitle">${UI.escapeHtml(s.name)}</div><span></span></div>
      <div class="card seasonDetailHero"><div class="seasonIcon bigSeason">${s.icon}</div><div><div class="label">Mission</div><div class="value">${UI.escapeHtml(info.mission)}</div><p class="sub">${UI.escapeHtml(s.description)}</p></div></div>
      <div class="card"><div class="label">What deserves attention</div>${info.attention.map(item=>`<div class="detailRow"><span>${UI.escapeHtml(item)}</span><strong>•</strong></div>`).join("")}</div>
      <div class="card quietMessage"><div class="label">Reflection</div><div class="value smallValue">${UI.escapeHtml(info.reflection)}</div></div>
      ${id!==data.seasonId?`<button class="btn secondary" data-action="makeCurrentSeason" data-season="${id}">Make Current Season</button>`:""}`;
    show("command");
  }

  function renderReview(){
    const accounts=reviewAccounts();
    if(!accounts.length){
      screens.review.innerHTML=`<div class="reviewHeader"><button class="back" data-screen="command">‹</button><div class="reviewTitle">Weekly Review</div><span></span></div><div class="empty">${completedAccounts().length?"No active accounts remain.":"Add your first account to begin."}</div><button class="btn" data-screen="accounts">${completedAccounts().length?"View Accounts":"Add Account"}</button>`;
      return;
    }
    if(data.review.status==="complete"){
      screens.review.innerHTML=`<div class="reviewHeader"><button class="back" data-screen="command">‹</button><div class="reviewTitle">Weekly Review</div><span></span></div><div class="card heroCard"><div><div class="label">This Week</div><div class="value">Complete</div><div class="sub">${betaMode()?"Beta review saved":"Next Thursday"}</div></div>${UI.cycle(4,"small")}</div><div class="card"><div class="label">Review</div><div class="sub">Your week is in order.</div><button class="btn secondary" data-action="beginNewReview">${betaMode()?"Enter Another Test Week":"Edit This Week’s Review"}</button></div>`;
      return;
    }
    if(data.review.status==="paidOffPrompt"){renderPaidOffPrompt();return;}
    if(data.review.status==="reflection"){renderAccountReflection();return;}
    if(data.review.status==="allUpdated"){renderAllUpdated();return;}
    if(data.review.status!=="inProgress"){
      const f=focus();
      screens.review.innerHTML=`<div class="reviewHeader"><button class="back" data-screen="command">‹</button><div class="reviewTitle">Weekly Review</div><span></span></div><div class="cycleWrap">${UI.cycle(0)}</div><div class="screenTitle">Weekly Review</div><p class="sub">Update your accounts one at a time.</p>${betaMode()?`<div class="card"><div class="label">Beta Mode</div><div class="sub">Choose the review date for this test week. This lets you enter several weeks of history in one sitting.</div><input id="betaReviewDateStart" type="date" value="${betaDefaultReviewDate()}"></div>`:""}${f?`<div class="card"><div class="label">This Week’s Focus</div><div class="value">${UI.escapeHtml(f.name)}</div><div class="sub">${UI.money(f.balance)} last reviewed</div></div>`:""}<div class="sub center">0 of ${accounts.length} accounts updated</div><button class="btn" data-action="beginNewReview">${betaMode()?"Start Test Review":"Start Review"}</button>`;
      return;
    }
    const index=Math.max(0,Math.min(data.review.index||0,accounts.length-1));
    const account=accounts[index];
    const seg=UI.reviewSegments(index,accounts.length);
    const draft=data.review.draft?.[account.id] ?? account.balance;
    screens.review.innerHTML=`
      <div class="reviewHeader"><button class="back" data-screen="command">‹</button><div class="reviewTitle">Weekly Review</div><button class="smallBtn" data-action="cancelReview">Close</button></div>
      <div class="cycleWrap">${UI.cycle(seg)}</div>
      <div class="reviewCount">Account ${index+1} of ${accounts.length}</div>
      <div class="accountName">${UI.escapeHtml(account.name)}</div>
      <div class="ledgerPair">
        <div><div class="label">Previous</div><div class="previousAmount">${UI.money(account.balance)}</div></div>
        <div class="ledgerLine"></div>
        <div><div class="label">Today</div><div class="ledgerWrap"><span>$</span><input id="todayBalance" inputmode="decimal" type="number" value="${Number(draft)||0}" aria-label="Today balance"></div></div>
      </div>
      <button class="btn reviewContinue" data-action="saveAccountReview">Continue</button>`;
    setTimeout(()=>{const input=UI.byId("todayBalance");if(input){input.focus();input.select();}},50);
  }

  function renderAccountReflection(){
    const pending=data.review.pendingReflection;
    const account=data.accounts.find(a=>a.id===pending?.accountId);
    if(!account){advanceReview();return;}
    const delta=Number(pending.delta)||0;
    const isIncrease=delta<0;
    screens.review.innerHTML=`
      <div class="reviewHeader"><button class="back" data-action="backFromReflection">‹</button><div class="reviewTitle">Weekly Review</div><span></span></div>
      <div class="cycleWrap">${UI.cycle(UI.reviewSegments((data.review.index||0)+1,reviewAccounts().length))}</div>
      <div class="card center reflectionCard">
        <div class="label">${UI.escapeHtml(account.name)}</div>
        ${changeLine(delta,account)}
        <p class="sub">${isIncrease?"Would you like to add a note for later?":"Recorded for this week."}</p>
        ${isIncrease?`<button class="btn secondary" data-action="addReflectionNote">Add Note</button>`:""}
        <button class="btn" data-action="continueAfterReflection">Continue</button>
      </div>`;
  }

  function renderPaidOffPrompt(){
    const pending=data.review.pendingPaidOff;
    const account=data.accounts.find(a=>a.id===pending?.accountId);
    if(!account){advanceReview();return;}
    screens.review.innerHTML=`
      <div class="reviewHeader"><button class="back" data-action="backFromPaidOffPrompt">‹</button><div class="reviewTitle">Weekly Review</div><span></span></div>
      <div class="cycleWrap">${UI.cycle(UI.reviewSegments(data.review.index||0,reviewAccounts().length))}</div>
      <div class="card center paidOffCard">
        <div class="pill">Account Completed</div>
        <div class="value" style="margin-top:18px">${UI.escapeHtml(account.name)}</div>
        <p class="sub">It looks like this account has been paid off.</p>
        <button class="btn" data-action="confirmPaidOff">Mark as Paid Off</button>
        <button class="btn secondary" data-action="notPaidOffYet">Not Yet</button>
      </div>`;
  }

  function renderAllUpdated(){
    const observations=weeklyObservations();
    const sentence=weeklyReflectionSentence(observations);
    screens.review.innerHTML=`
      <div class="reviewHeader"><button class="back" data-action="resumeLastAccount">‹</button><div class="reviewTitle">Weekly Review</div><span></span></div>
      <div class="cycleWrap">${UI.cycle(4)}</div>
      <div class="screenTitle">This Week</div>
      <p class="sub reflectionSentence">${UI.escapeHtml(sentence)}</p>
      <div class="card reflectionList">${observations.map(o=>`<div class="reflectionRow"><span>${UI.escapeHtml(o.label)}</span><strong class="${o.kind}">${o.value}</strong></div>`).join("")}</div>
      ${patternNotices(true).length?`<div class="card quietMessage"><div class="label">Pattern noticed</div>${patternNotices(true).map(n=>`<p class="sub"><b>${UI.escapeHtml(n.label)}</b>: ${UI.escapeHtml(n.message)}</p>`).join("")}<p class="sub">Seasons notices the pattern. You still choose the next step.</p></div>`:""}
      ${seasonalChangeSignal()?`<div class="card quietMessage tappableCard" data-action="beginSeasonalChange"><div class="label">We've noticed a seasonal change.</div><p class="sub">After this review, Seasons may ask whether your current season still fits.</p><div class="miniChev">›</div></div>`:""}
      ${dueFutureChanges().length?`<div class="card quietMessage tappableCard" data-action="showFutureChanges"><div class="label">Horizon item ready</div>${dueFutureChanges().slice(0,2).map(c=>`<p class="sub"><b>${UI.escapeHtml(c.title||changeTypeLabel(c.type))}</b>: ${UI.escapeHtml(redirectLine(c))}</p>`).join("")}<div class="miniChev">›</div></div>`:""}
      <button class="btn" data-action="closeWeek">Close Week</button>`;
  }

  function renderWeekClosed(){
    screens.review.innerHTML=`
      <div class="closed">
        ${UI.cycle(4,"large")}
        <div class="check" style="width:46px;height:46px;font-size:24px;margin-top:26px">✓</div>
        <div class="message">Your week is in order.</div>
        <p class="sub">See you next Thursday.</p>
      </div>`;
    show("review");
    setTimeout(()=>render("command"),3200);
  }

  function historyForAccount(account){
    const entries=(data.snapshots||[])
      .map(snapshot=>{const found=(snapshot.accounts||[]).find(item=>item.id===account.id);return found?{date:snapshot.date,balance:Number(found.balance)||0}:null;})
      .filter(Boolean)
      .sort((a,b)=>new Date(b.date)-new Date(a.date));
    return entries;
  }

  function renderAccounts(){
    const accounts=activeAccounts();
    const debts=accounts.filter(isDebt);
    const foundations=accounts.filter(isFoundation);
    const complete=completedAccounts();
    const f=focus();
    const row=(a)=>{const promo=promoSummary(a);return `<div class="accountRow" data-action="showAccountDetail" data-id="${a.id}"><div class="accountMeta"><div>${f&&f.id===a.id?`<span class="focusDot"></span>`:""}${accountIcon(a)?`<span class="foundationIcon">${accountIcon(a)}</span> `:""}${UI.escapeHtml(a.name)}</div><div class="sub">${UI.escapeHtml(a.type||"Account")}${promo?` • ${promo}`:""}</div></div><div class="row"><span>${UI.money(a.balance)}</span></div></div>`};
    screens.accounts.innerHTML=`
      <div class="reviewHeader"><div class="screenTitle">Accounts</div><button class="smallBtn" data-action="showAddAccount">＋</button></div>
      <div class="sectionLabel">Active Debts</div>
      <div class="accountList">${debts.length?debts.map(row).join(""):`<div class="empty">No active debts.</div>`}</div>
      <div class="sectionLabel">Foundations</div>
      <div class="accountList">${foundations.length?foundations.map(row).join(""):`<div class="empty">No foundations yet.</div>`}</div>
      ${complete.length?`<div class="sectionLabel completedLabel">Completed</div><div class="accountList">${complete.map(a=>`<div class="accountRow completedRow" data-action="showAccountDetail" data-id="${a.id}"><div class="accountMeta"><div><span class="check miniCheck">✓</span>${UI.escapeHtml(a.name)}</div><div class="sub">Completed ${a.completedAt?UI.prettySnapshotDate(a.completedAt):""}</div></div><div>${UI.money(0)}</div></div>`).join("")}</div>`:""}
      <button class="btn secondary" data-action="showAddAccount">Add Account</button><button class="btn secondary" data-action="showFutureChanges">On the Horizon</button><button class="btn secondary" data-action="exportBalancesExcel">Export Balances to Excel</button>`;
  }

  function renderAccountDetail(account){
    const promo=promoSummary(account);
    const history=historyForAccount(account);
    screens.accounts.innerHTML=`
      <div class="reviewHeader"><button class="back" data-action="backToAccounts">‹</button><div class="reviewTitle">${UI.escapeHtml(account.name)}</div><button class="smallBtn" data-action="manageAccount" data-id="${account.id}">Manage</button></div>
      ${focus()?.id===account.id?`<div class="pill detailPill">Focus Account</div>`:""}
      ${account.paidOff?`<div class="pill detailPill">Paid Off</div>`:""}
      <div class="card detailCard">
        <div class="detailRow"><span>Current Balance</span><strong>${UI.money(account.balance)}</strong></div>
        ${isDebt(account)?`<div class="detailRow"><span>APR</span><strong>${Number(account.apr||0).toFixed(2)}%</strong></div><div class="detailRow"><span>Minimum Payment</span><strong>${UI.money(account.min)}</strong></div><div class="detailRow"><span>Statement Day</span><strong>${account.statementDay?UI.escapeHtml(account.statementDay):"—"}</strong></div>`:`<div class="detailRow"><span>Purpose</span><strong>Foundation</strong></div>`}
      </div>
      ${account.promoEnabled?`<div class="card detailCard"><div class="label">Promotional APR</div><div class="detailRow"><span>Current Promo APR</span><strong>${Number(account.promoApr||0).toFixed(2)}%</strong></div><div class="detailRow"><span>Expires</span><strong>${account.promoExpires?UI.prettyDate(account.promoExpires):"—"}</strong></div><div class="detailRow"><span>Standard APR After</span><strong>${Number(account.standardApr||account.apr||0).toFixed(2)}%</strong></div>${promo?`<div class="helper">${promo}</div>`:""}${account.promoReminderEnabled?`<div class="detailRow"><span>Reminder timing</span><strong>${promoReminderTimingLabel(account.promoReminderDays)}</strong></div>`:""}</div>`:""}
      <div class="card detailCard"><div class="label">Balance History</div>${history.length?history.slice(0,8).map(entry=>`<div class="detailRow"><span>${UI.prettySnapshotDate(entry.date)}</span><strong>${UI.money(entry.balance)}</strong></div>`).join(""):`<div class="sub">Balance history will appear after Weekly Reviews.</div>`}</div>
      <div class="card quietMessage"><div class="label">Balance Pattern</div><div class="value smallValue">${trendForAccount(account,false).status==="attention"?"Needs Attention":trendForAccount(account,false).status==="good"?"On Track":"Watching"}</div><p class="sub">${UI.escapeHtml(trendForAccount(account,false).message)}</p></div>
      ${account.note?`<div class="card"><div class="label">Notes</div><div class="sub">${UI.escapeHtml(account.note)}</div></div>`:""}`;
    show("accounts");
  }

  function renderManageAccount(account){
    screens.accounts.innerHTML=`
      <div class="reviewHeader"><button class="back" data-action="showAccountDetail" data-id="${account.id}">‹</button><div class="reviewTitle">Manage Account</div><span></span></div>
      <div class="card accountList">
        <button class="settingChoice" data-action="editAccount" data-id="${account.id}"><span><b>Edit Details</b><span class="sub">${isFoundation(account)?"Update balance, purpose, or notes.":"Update APR, payment, promo, or notes."}</span></span><span class="miniChev">›</span></button>
        ${!account.paidOff?`<button class="settingChoice" data-action="markPaidOff" data-id="${account.id}"><span><b>Mark as Paid Off</b><span class="sub">Move this account to Completed.</span></span><span class="miniChev">›</span></button>`:""}
        <button class="settingChoice" data-action="archiveAccount" data-id="${account.id}"><span><b>Archive</b><span class="sub">Hide this account from normal use.</span></span><span class="miniChev">›</span></button>
      </div>`;
    show("accounts");
  }

  function renderAccountForm(account=null){
    const isEdit=Boolean(account);const promoOn=Boolean(account?.promoEnabled);
    const kind=isFoundation(account)?"foundation":"debt";
    screens.accounts.innerHTML=`
      <div class="reviewHeader"><button class="back" data-action="backToAccounts">‹</button><div class="reviewTitle">${isEdit?"Edit Account":"Add Account"}</div><span></span></div>
      <div class="card">
        <div class="label">What would you like to add?</div>
        <label class="label" for="formType">Account Type</label><select id="formType" data-action="accountTypeChanged">
          <option ${account?.type==="Credit Card"?"selected":""}>Credit Card</option>
          <option ${account?.type==="Auto Loan"?"selected":""}>Auto Loan</option>
          <option ${account?.type==="Personal Loan"?"selected":""}>Personal Loan</option>
          <option ${account?.type==="Student Loan"?"selected":""}>Student Loan</option>
          <option ${account?.type==="HELOC"?"selected":""}>HELOC</option>
          <option ${account?.type==="Emergency Fund"?"selected":""}>Emergency Fund</option>
          <option ${account?.type==="Retirement"?"selected":""}>Retirement</option>
        </select>
        <p class="sub" id="accountTypeHelp">${kind==="foundation"?"Foundation accounts track what you are building.":"Debt accounts track what you are paying down."}</p>
      </div>
      <div class="card">
        <label class="label" for="formName">Account Name</label><input id="formName" value="${UI.escapeHtml(account?.name||"")}" placeholder="${kind==="foundation"?"e.g., Emergency Fund":"e.g., Chase Freedom"}">
        <label class="label" for="formBalance">Current Balance</label><input id="formBalance" type="number" inputmode="decimal" value="${Number(account?.balance)||0}">
        <div id="debtFields" class="${kind==="foundation"?"hidden":""}">
          <label class="label" for="formApr">Standard APR</label><input id="formApr" type="number" inputmode="decimal" value="${Number(account?.apr)||0}">
          <label class="label" for="formMin">Minimum Payment</label><input id="formMin" type="number" inputmode="decimal" value="${Number(account?.min)||0}">
          <label class="label" for="formStatementDay">Statement Day</label><input id="formStatementDay" inputmode="numeric" value="${UI.escapeHtml(account?.statementDay||"")}" placeholder="e.g., 15th">
        </div>
      </div>
      <div id="promoCard" class="card promoCard ${kind==="foundation"?"hidden":""}"><label class="toggleRow"><span><span class="label">Promotional APR</span><span class="sub">Track intro rates, expiration dates, and quiet reminders.</span></span><input id="formPromo" type="checkbox" ${promoOn?"checked":""}></label><div id="promoFields" class="${promoOn?"":"hidden"}"><label class="label" for="formPromoApr">Current Promo APR</label><input id="formPromoApr" type="number" inputmode="decimal" value="${Number(account?.promoApr)||0}"><label class="label" for="formPromoExpires">Expires</label><input id="formPromoExpires" type="date" value="${UI.escapeHtml(account?.promoExpires||"")}"><label class="label" for="formStandardApr">Standard APR After</label><input id="formStandardApr" type="number" inputmode="decimal" value="${Number(account?.standardApr||account?.apr)||0}"><label class="toggleRow promoReminderRow"><span><span class="label">Remind me before this promotion ends</span><span class="sub">This will appear on This Week as something on the horizon.</span></span><input id="formPromoReminder" type="checkbox" ${account?.promoReminderEnabled?"checked":""}></label><div id="promoReminderFields" class="${account?.promoReminderEnabled?"":"hidden"}"><label class="label" for="formPromoReminderDays">Reminder timing</label><select id="formPromoReminderDays"><option value="90" ${Number(account?.promoReminderDays)===90?"selected":""}>90 days before</option><option value="60" ${Number(account?.promoReminderDays)===60?"selected":""}>60 days before</option><option value="30" ${!account?.promoReminderDays||Number(account?.promoReminderDays)===30?"selected":""}>30 days before</option><option value="14" ${Number(account?.promoReminderDays)===14?"selected":""}>14 days before</option><option value="7" ${Number(account?.promoReminderDays)===7?"selected":""}>7 days before</option></select></div><div class="helper" id="promoReviews">${account?.promoExpires?`${E.weeklyReviewsUntil(account.promoExpires)} week${E.weeklyReviewsUntil(account.promoExpires)===1?"":"s"} remaining`:"Add an expiration date to see weeks remaining."}</div></div></div>
      <div class="card"><label class="label" for="formNote">Notes</label><textarea id="formNote" placeholder="Optional">${UI.escapeHtml(account?.note||"")}</textarea></div>
      <div class="formFooter"><button class="btn formSaveBtn" data-action="saveAccount" data-id="${account?.id||""}">${isEdit?"Save Changes":"Save Account"}</button></div>`;
    show("accounts");setTimeout(()=>wirePromoForm(),0);
  }


  function renderFutureChanges(){
    const changes=futureChanges();
    const summary=futureCapacitySummary();
    const row=change=>{const projection=futureChangeFocusProjection(change);return `<div class="accountRow" data-action="showFutureChangeDetail" data-id="${change.id}"><div class="accountMeta"><div>${futureChangeIsDue(change)?'<span class="focusDot"></span>':''}${UI.escapeHtml(change.title||changeTypeLabel(change.type))}</div><div class="sub">${changeTypeLabel(change.type)} • ${change.frequency==="oneTime"?"One-time":"Monthly"} • ${change.date?UI.prettyDate(change.date):"No date"}${projection?`<br>${UI.escapeHtml(projection)}`:""}</div></div><div class="row"><span>${change.frequency==="oneTime"?UI.money(change.amount):`+${UI.money(change.amount)}/mo`}</span><span class="miniChev">›</span></div></div>`};
    screens.accounts.innerHTML=`
      <div class="reviewHeader"><button class="back" data-action="backToAccounts">‹</button><div class="reviewTitle">On the Horizon</div><button class="smallBtn" data-action="showFutureChangeForm">＋</button></div>
      <div class="card quietMessage"><div class="label">On the Horizon</div><div class="value smallValue">${summary.monthly?`+${UI.money(summary.monthly)}/mo`:"No monthly changes yet"}</div><p class="sub">${summary.oneTime?`${UI.money(summary.oneTime)} in one-time changes is also planned. `:""}Use this for things you already anticipate: bonuses, tax refunds, raises, a loan ending, or daycare ending.</p></div>
      ${dueFutureChanges().length?`<div class="sectionLabel">Ready to Review</div><div class="accountList">${dueFutureChanges().map(row).join("")}</div>`:""}
      <div class="sectionLabel">Upcoming</div>
      <div class="accountList">${changes.length?changes.map(row).join(""):`<div class="empty">Nothing new on the horizon.</div>`}</div>
      <button class="btn" data-action="showFutureChangeForm">Add to Horizon</button>`;
    show("accounts");
  }

  function renderFutureChangeDetail(change){
    screens.accounts.innerHTML=`
      <div class="reviewHeader"><button class="back" data-action="showFutureChanges">‹</button><div class="reviewTitle">On the Horizon</div><button class="smallBtn" data-action="editFutureChange" data-id="${change.id}">Edit</button></div>
      ${futureChangeIsDue(change)?`<div class="pill detailPill">Ready to Review</div>`:""}
      <div class="card detailCard"><div class="label">${UI.escapeHtml(changeTypeLabel(change.type))}</div><div class="value">${UI.escapeHtml(change.title||"Upcoming change")}</div><p class="sub">${UI.escapeHtml(change.note||"Something on the horizon that may affect what deserves attention.")}</p><div class="detailRow"><span>Date</span><strong>${change.date?UI.prettyDate(change.date):"—"}</strong></div><div class="detailRow"><span>Amount</span><strong>${change.frequency==="oneTime"?UI.money(change.amount):`+${UI.money(change.amount)}/mo`}</strong></div><div class="detailRow"><span>Planned Allocation</span><strong>${UI.escapeHtml(futureChangeDestination(change))}</strong></div></div>
      <div class="card quietMessage"><div class="label">When this arrives</div><p class="sub">${UI.escapeHtml(redirectLine(change))}</p></div>
      ${futureChangeFocusProjection(change)?`<div class="card quietMessage"><div class="label">Projected effect</div><p class="sub">${UI.escapeHtml(futureChangeFocusProjection(change))}</p></div>`:""}
      ${futureChangeIsDue(change)?`<button class="btn" data-action="completeFutureChange" data-id="${change.id}">Mark Reviewed</button><button class="btn secondary" data-action="snoozeFutureChange" data-id="${change.id}">Remind Me Later</button>`:""}
      <button class="btn danger" data-action="archiveFutureChange" data-id="${change.id}">Archive</button>`;
    show("accounts");
  }

  function futureAllocationRows(change,accounts){
    const allocations=futureChangeAllocations(change);
    const rows=[0,1,2].map(i=>allocations[i]||{target:i===0?"focus":"",mode:"percent",value:i===0&&!allocations.length?100:""});
    const optionMarkup=(selected)=>`<option value="" ${!selected?"selected":""}>Decide later</option><option value="focus" ${selected==="focus"?"selected":""}>Current Focus Account</option><option value="Emergency Fund" ${selected==="Emergency Fund"?"selected":""}>Emergency Fund</option><option value="Retirement" ${selected==="Retirement"?"selected":""}>Retirement</option>${accounts.map(a=>`<option value="acct:${a.id}" ${selected===`acct:${a.id}`?"selected":""}>${UI.escapeHtml(a.name)}</option>`).join("")}`;
    return `<div class="allocationList">${rows.map((row,i)=>`<div class="allocationRow"><select class="futureAllocTarget" data-index="${i}">${optionMarkup(row.target||"")}</select><input class="futureAllocValue" data-index="${i}" type="number" inputmode="decimal" value="${UI.escapeHtml(row.value||"")}" placeholder="${i===0?"100":""}"><select class="futureAllocMode" data-index="${i}"><option value="percent" ${row.mode!=="amount"?"selected":""}>%</option><option value="amount" ${row.mode==="amount"?"selected":""}>$</option></select></div>`).join("")}</div>`;
  }

  function renderFutureChangeForm(change=null){
    const isEdit=Boolean(change);
    const accounts=activeAccounts();
    screens.accounts.innerHTML=`
      <div class="reviewHeader"><button class="back" data-action="showFutureChanges">‹</button><div class="reviewTitle">${isEdit?"Edit":"Add"} Horizon Item</div><span></span></div>
      <div class="card"><div class="label">What is changing?</div><select id="futureType"><option value="monthlyIncrease" ${change?.type==="monthlyIncrease"?"selected":""}>Available amount to pay debt increases</option><option value="expenseEnding" ${change?.type==="expenseEnding"?"selected":""}>An expense ends</option><option value="debtPayoff" ${change?.type==="debtPayoff"?"selected":""}>A debt payment frees up</option><option value="bonus" ${change?.type==="bonus"?"selected":""}>Holiday bonus / windfall</option><option value="incomeIncrease" ${change?.type==="incomeIncrease"?"selected":""}>Income increase</option><option value="other" ${change?.type==="other"?"selected":""}>Something else</option></select></div>
      <div class="card"><label class="label" for="futureTitle">Name</label><input id="futureTitle" value="${UI.escapeHtml(change?.title||"")}" placeholder="e.g., Holiday bonus or Daycare ends"><label class="label" for="futureDate">Expected Date</label><input id="futureDate" type="date" value="${UI.escapeHtml(change?.date||"")}"><label class="label" for="futureAmount">Amount</label><input id="futureAmount" type="number" inputmode="decimal" value="${Number(change?.amount)||0}"><label class="label" for="futureFrequency">How often?</label><select id="futureFrequency"><option value="monthly" ${change?.frequency!=="oneTime"?"selected":""}>Monthly capacity</option><option value="oneTime" ${change?.frequency==="oneTime"?"selected":""}>One-time amount</option></select></div>
      <div class="card"><div class="label">Where should this capacity go?</div><p class="sub">Choose one or more directions, then assign either a percentage or a dollar amount.</p>${futureAllocationRows(change,accounts)}<p class="sub">Seasons will not move money. It will remember what you intended and ask when the change arrives.</p></div>
      <div class="card"><label class="label" for="futureNote">Notes</label><textarea id="futureNote" placeholder="Optional">${UI.escapeHtml(change?.note||"")}</textarea></div>
      <button class="btn" data-action="saveFutureChange" data-id="${change?.id||""}">${isEdit?"Save Changes":"Save Horizon Item"}</button>`;
    show("accounts");
  }

  function journeyEvents(){
    const events=[];
    (data.snapshots||[]).forEach(snapshot=>{
      events.push({date:snapshot.date,title:"Weekly Review completed",sub:snapshot.reflection||"Your balances were reviewed.",kind:"review"});
      (snapshot.patternNotices||[]).forEach(n=>events.push({date:snapshot.date,title:"Pattern noticed",sub:n.message,kind:"pattern"}));
    });
    completedAccounts().forEach(account=>events.push({date:account.completedAt,title:`${account.name} completed`,sub:"An account moved into your completed history.",kind:"milestone"}));
    if(data.seasonSince)events.push({date:data.seasonSince,title:`Entered ${data.seasonName}`,sub:"A financial season began.",kind:"season"});
    (data.futureChanges||[]).filter(c=>c.status==="complete"&&c.completedAt).forEach(c=>events.push({date:c.completedAt,title:`${c.title||changeTypeLabel(c.type)} completed`,sub:redirectLine(c),kind:"future"}));
    return events.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,40);
  }
  function renderHistory(){
    const events=journeyEvents();
    const reviews=(data.snapshots||[]).length;
    const completed=completedAccounts().length;
    screens.history.innerHTML=`
      <div class="reviewHeader"><div class="screenTitle">Journal</div><span></span></div>
      <div class="card quietMessage"><div class="label">Financial journal</div><div class="value smallValue">Here's what has become significant over time.</div><p class="sub">The Journal is not an activity log. It records reviews, decisions, season changes, and moments that may still matter years from now.</p></div>
      <div class="historyStats"><div><b>${reviews}</b><span>Reviews</span></div><div><b>${completed}</b><span>Completed</span></div><div><b>${season(data.seasonId).name}</b><span>Current Season</span></div></div>
      <div class="sectionLabel">Journal</div>
      <div class="journeyList">${events.length?events.map(event=>`<div class="journeyItem ${event.kind}"><div class="journeyDate">${UI.escapeHtml(UI.prettySnapshotDate(event.date)||event.date||"")}</div><div><b>${UI.escapeHtml(event.title)}</b><p>${UI.escapeHtml(event.sub||"")}</p></div></div>`).join(""):`<div class="empty">Complete Weekly Reviews to begin building your financial journal.</div>`}</div>`;
  }

  function renderSettings(){
    const dev=data.devMode;
    screens.settings.innerHTML=`<div class="screenTitle">Settings</div>
      ${updateInfo?`<div class="updateBanner"><div><b>New version available</b><div class="sub">${UI.escapeHtml(updateInfo.version||"Update")}</div></div><button class="smallBtn" data-action="reloadUpdate">Reload</button></div>`:""}
      <div class="card"><div class="settingsGroup"><div class="label">Preferences</div><button class="settingRow tappable" data-action="editReviewDay"><span>Weekly Review Day</span><span><span class="muted">${UI.escapeHtml(data.reviewDay)}</span><span class="miniChev">›</span></span></button><button class="settingRow tappable" data-action="editReviewTime"><span>Review Time</span><span><span class="muted">${UI.escapeHtml(data.reviewTime)}</span><span class="miniChev">›</span></span></button><button class="settingRow tappable" data-action="editStrategy"><span>Focus Strategy</span><span><span class="muted">${UI.strategyLabel(data.strategy)}</span><span class="miniChev">›</span></span></button><button class="settingRow tappable" data-action="showFutureChanges"><span>On the Horizon</span><span><span class="muted">${activeFutureChanges().length}</span><span class="miniChev">›</span></span></button></div></div>
      <div class="card"><div class="settingsGroup"><div class="label">Testing</div><button class="settingRow tappable" data-action="toggleBetaMode"><span>Beta Mode</span><span><span class="muted">${betaMode()?"On":"Off"}</span><span class="miniChev">›</span></span></button>${betaMode()?`<button class="settingRow tappable" data-action="seedBetaReviews"><span>Seed 4 Test Reviews</span><span class="miniChev">›</span></button><button class="settingRow tappable" data-action="clearSnapshots"><span>Clear Review History</span><span class="miniChev">›</span></button><div class="sub">Beta Mode lets you enter multiple backdated Weekly Reviews to test pattern recognition.</div>`:""}</div></div>
      <div class="card"><div class="label">Privacy</div><div class="value">Local</div><div class="sub">No bank connections. Your information stays on this device unless you export it.</div></div>
      <div class="card"><button class="settingRow tappable" data-action="tapVersion"><span>Version</span><span><span class="muted">${APP_VERSION} · Build ${APP_BUILD}</span><span class="miniChev">›</span></span></button><button class="settingRow tappable" data-action="forceUpdateCheck"><span>Check for Update</span><span class="miniChev">›</span></button></div>
      ${dev?`<div class="card"><div class="label">Developer</div><button class="settingRow tappable" data-action="loadDemoData"><span>Load Demo Data</span><span class="miniChev">›</span></button><button class="settingRow tappable" data-action="clearAppCache"><span>Clear App Cache</span><span class="miniChev">›</span></button><button class="settingRow tappable" data-action="resetAll"><span class="dangerText">Reset Local Data</span><span class="miniChev">›</span></button></div>`:""}
      <button class="btn secondary" data-action="exportBalancesExcel">Export Balances to Excel</button><button class="btn secondary" data-action="exportData">Export Backup</button>${dev?"":`<button class="btn danger" data-action="resetAll">Reset Local Data</button>`}`;
  }

  function renderDayPicker(){const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];screens.settings.innerHTML=`<div class="reviewHeader"><button class="back" data-action="backToSettings">‹</button><div class="reviewTitle">Weekly Review Day</div><span></span></div><div class="card accountList">${days.map(day=>`<button class="settingChoice ${data.reviewDay===day?"selected":""}" data-action="setReviewDay" data-value="${day}"><span>${day}</span>${data.reviewDay===day?'<span class="check">✓</span>':''}</button>`).join("")}</div>`;show("settings");}
  function renderStrategyPicker(){const strategies=[{value:"avalanche",label:"Highest Interest First",sub:"Save more by paying interest first."},{value:"snowball",label:"Smallest Balance First",sub:"Build momentum through early wins."}];screens.settings.innerHTML=`<div class="reviewHeader"><button class="back" data-action="backToSettings">‹</button><div class="reviewTitle">Focus Strategy</div><span></span></div><div class="card accountList">${strategies.map(strategy=>`<button class="settingChoice ${data.strategy===strategy.value?"selected":""}" data-action="setStrategy" data-value="${strategy.value}"><span><b>${strategy.label}</b><span class="sub">${strategy.sub}</span></span>${data.strategy===strategy.value?'<span class="check">✓</span>':''}</button>`).join("")}</div>`;show("settings");}

  function wirePromoForm(){
    const checkbox=UI.byId("formPromo");
    const fields=UI.byId("promoFields");
    const expires=UI.byId("formPromoExpires");
    const reviews=UI.byId("promoReviews");
    const standard=UI.byId("formApr");
    const after=UI.byId("formStandardApr");
    const reminder=UI.byId("formPromoReminder");
    const reminderFields=UI.byId("promoReminderFields");
    const syncStandardAfter=()=>{
      if(!standard || !after)return;
      const current=String(after.value||"").trim();
      if(current==="" || Number(current)===0){after.value=standard.value||"";}
    };
    if(checkbox&&fields){
      checkbox.addEventListener("change",()=>{
        fields.classList.toggle("hidden",!checkbox.checked);
        if(checkbox.checked)syncStandardAfter();
      });
      if(checkbox.checked)syncStandardAfter();
    }
    if(standard&&after){
      standard.addEventListener("input",()=>{if(checkbox?.checked)syncStandardAfter();});
    }
    if(reminder&&reminderFields){reminder.addEventListener("change",()=>reminderFields.classList.toggle("hidden",!reminder.checked));}
    if(expires&&reviews){expires.addEventListener("input",()=>{const n=E.weeklyReviewsUntil(expires.value);reviews.textContent=n===null?"Add an expiration date to see weeks remaining.":`${n} week${n===1?"":"s"} remaining`;});}
  }

  function advanceReview(){const accounts=reviewAccounts();if(data.review.index>=accounts.length-1){data.review.status="allUpdated";}else{data.review.index+=1;data.review.status="inProgress";}data.review.pendingPaidOff=null;data.review.pendingReflection=null;saveRender("review");}
  function completeAccount(account){account.balance=0;account.paidOff=true;account.completedAt=new Date().toISOString();}

  async function checkForUpdate(silent=true){
    try{
      const response=await fetch(`version.json?ts=${Date.now()}`,{cache:"no-store"});
      if(!response.ok)throw new Error("No version file");
      const latest=await response.json();
      if(Number(latest.build)>APP_BUILD){updateInfo=latest;if(!silent)alert("A new version is available.");render(data.setupComplete?"settings":"command");return true;}
      updateInfo=null;if(!silent)alert("Seasons is up to date.");return false;
    }catch(error){if(!silent)alert("Could not check for updates right now.");return false;}
  }
  async function clearCaches(){
    if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(reg=>reg.update().catch(()=>{})));}
    if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(key=>caches.delete(key)));}
  }
  function loadDemoDataset(){
    data.setupComplete=true;data.reviewDay=data.reviewDay||"Thursday";data.reviewTime=data.reviewTime||"7:30 PM";data.strategy=data.strategy||"avalanche";data.seasonId="establish";data.seasonName="Establish";data.seasonSince="June 2026";
    data.accounts=[
      {id:"demo_chase",name:"Chase Freedom",type:"Credit Card",balance:5427,apr:24.99,min:135,statementDay:"15th",note:"",promoEnabled:false,promoApr:0,promoExpires:"",standardApr:24.99,archived:false,paidOff:false,completedAt:null},
      {id:"demo_citi",name:"Citi",type:"Credit Card",balance:3820,apr:0,min:92,statementDay:"9th",note:"Promo rate",promoEnabled:true,promoApr:0,promoExpires:new Date(Date.now()+86400000*80).toISOString().slice(0,10),standardApr:24.49,archived:false,paidOff:false,completedAt:null},
      {id:"demo_auto",name:"Car Loan",type:"Auto Loan",balance:11420,apr:6.25,min:412,statementDay:"",note:"",promoEnabled:false,promoApr:0,promoExpires:"",standardApr:6.25,archived:false,paidOff:false,completedAt:null}
    ];
    data.startingAmount=20667;data.snapshots=[];data.review={status:"ready",index:0,draft:{},lastCompleted:null,nextReview:"Next Thursday",pendingPaidOff:null,pendingReflection:null,notes:{}};saveRender("command");
  }

  function exportBalancesExcel(){
    const rows=[];
    rows.push(["Section","Account","Type","Current Balance","APR","Minimum Payment","Promo APR","Promo Expires","Standard APR After","Paid Off","Archived","Pattern Status","Pattern Message","Last Updated"]);
    E.allAccounts(data).forEach(account=>{
      const kind=isFoundation(account)?"Foundation":account.paidOff?"Completed Debt":"Active Debt";
      const trend=trendForAccount(account,false);
      rows.push([
        kind,
        account.name||"Account",
        account.type||"Account",
        Number(account.balance)||0,
        isDebt(account)?(Number(account.apr)||0):"",
        isDebt(account)?(Number(account.min)||0):"",
        isDebt(account)&&account.promoEnabled?(Number(account.promoApr)||0):"",
        isDebt(account)&&account.promoEnabled?(account.promoExpires||""):"",
        isDebt(account)&&account.promoEnabled?(Number(account.standardApr||account.apr)||0):"",
        account.paidOff?"Yes":"No",
        account.archived?"Yes":"No",
        trend.status||"",
        trend.message||"",
        new Date().toLocaleString()
      ]);
    });
    rows.push([]);
    rows.push(["Balance History"]);
    rows.push(["Review Date","Account","Type","Balance","Paid Off","Focus Account","Review Reflection","Pattern Notices","Note"]);
    (data.snapshots||[]).forEach(snapshot=>{
      const notices=(snapshot.patternNotices||[]).map(n=>n.message).join(" | ");
      (snapshot.accounts||[]).forEach(item=>{
        rows.push([
          snapshot.date||"",
          item.name||"Account",
          item.type||"Account",
          Number(item.balance)||0,
          item.paidOff?"Yes":"No",
          snapshot.focusAccountId===item.id?"Yes":"No",
          snapshot.reflection||"",
          notices,
          snapshot.notes?.[item.id]||""
        ]);
      });
    });
    rows.push([]);
    rows.push(["On the Horizon"]);
    rows.push(["Title","Type","Date","Amount","Frequency","Planned Allocation","Allocation Details","Status","Notes"]);
    futureChanges().forEach(change=>rows.push([change.title||"",changeTypeLabel(change.type),change.date||"",Number(change.amount)||0,changeFrequencyLabel(change),futureChangeDestination(change),JSON.stringify(futureChangeAllocations(change)),change.status||"planned",change.note||""]));
    const html=`<html><head><meta charset="utf-8"></head><body><table>${rows.map(row=>`<tr>${row.map(cell=>`<td>${UI.escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</table></body></html>`;
    const blob=new Blob([html],{type:"application/vnd.ms-excel"});
    const link=document.createElement("a");
    link.href=URL.createObjectURL(blob);
    const stamp=new Date().toISOString().slice(0,10);
    link.download=`seasons-account-balances-and-history-${stamp}.xls`;
    link.click();
    setTimeout(()=>URL.revokeObjectURL(link.href),1000);
  }

  function seedBetaReviews(){
    const accounts=reviewAccounts();
    if(!accounts.length){alert("Add at least one account before seeding test reviews.");return;}
    const baseDate=new Date();baseDate.setDate(baseDate.getDate()-28);
    data.snapshots=data.snapshots||[];
    const original=Object.fromEntries(accounts.map(a=>[a.id,Number(a.balance)||0]));
    for(let week=0;week<4;week++){
      const d=new Date(baseDate);d.setDate(baseDate.getDate()+week*7);
      const accountRows=accounts.map((a,index)=>{
        const start=original[a.id];
        let balance=start;
        if(isDebt(a)){balance=Math.max(0,start + (index===0?week*75:-week*50));}
        else{balance=Math.max(0,start + (index===0?-week*40:week*60));}
        return {id:a.id,name:a.name,type:a.type||"Account",balance,paidOff:Boolean(a.paidOff)};
      });
      data.snapshots.push({date:d.toISOString(),beta:true,totalBalance:accountRows.reduce((sum,a)=>sum+a.balance,0),focusAccountId:focus()?.id||null,reflection:"Beta test review saved.",observations:[],patternNotices:[],notes:{},accounts:accountRows});
    }
    saveRender("settings");
  }

  const actions={
    startSeasonReflection(){data.onboarding.step="discover";saveRender("onboarding");},
    recommendCurrentSeason(){data.onboarding.answers={q1:UI.byId("seasonQ1").value,q2:UI.byId("seasonQ2").value,q3:UI.byId("seasonQ3").value};data.onboarding.recommendedSeason=recommendSeason();data.onboarding.step="recommendation";saveRender("onboarding");},
    acceptSeasonRecommendation(){setSeason(data.onboarding.recommendedSeason||"establish");data.onboarding.step="setup";saveRender("onboarding");},
    chooseAnotherSeason(){data.onboarding.step="chooseSeason";saveRender("onboarding");},
    selectSeason(node){setSeason(node.dataset.season||"establish");data.onboarding.step="setup";saveRender("onboarding");},
    backToCommand(){render("command");},
    toggleBetaMode(){data.betaMode=!betaMode();saveRender("settings");},
    seedBetaReviews(){if(confirm("Add four backdated beta reviews using your current accounts?")){seedBetaReviews();}},
    clearSnapshots(){if(confirm("Clear review history snapshots? Current account balances will stay unchanged.")){data.snapshots=[];data.seasonalChange=null;saveRender("settings");}},
    beginSeasonalChange(){renderSeasonalChangeIntro();},
    answerSeasonalPriority(node){renderSeasonalChangeRecommendation(node.dataset.value,node.dataset.suggested);},
    enterSuggestedSeason(node){setSeason(node.dataset.season||"establish");data.seasonalChange={acceptedReviewDate:latestReviewDate(),dismissedReviewDate:latestReviewDate()};save();renderSeasonDetail();},
    keepCurrentSeason(){data.seasonalChange={dismissedReviewDate:latestReviewDate(),keptSeason:data.seasonId||"establish"};saveRender("command");},
    dismissSeasonalChange(){data.seasonalChange={dismissedReviewDate:latestReviewDate(),keptSeason:data.seasonId||"establish"};saveRender("command");},
    showSeasonDetail(){renderSeasonDetail();},
    showSeasonInfo(node){renderSeasonInfo(node.dataset.season||data.seasonId||"establish");},
    makeCurrentSeason(node){setSeason(node.dataset.season||"establish");save();renderSeasonDetail();},
    showFocusDetail(){const f=focus();if(f)renderAccountDetail(f);else renderAccountForm();},
    showFocusWhy(){const f=focus();if(!f){renderAccountForm();return;}screens.command.innerHTML=`<div class="reviewHeader"><button class="back" data-action="backToCommand">‹</button><div class="reviewTitle">Why this focus?</div><span></span></div><div class="card seasonDetailHero"><div><div class="label">Current Focus</div><div class="value">${UI.escapeHtml(f.name)}</div><p class="sub">${UI.escapeHtml(focusReason(f))}</p></div></div><div class="card"><div class="label">Why am I seeing this?</div>${focusReasonDetails(f).map(item=>`<p class="sub">• ${UI.escapeHtml(item)}</p>`).join("")}</div>${isDebt(f)?`<div class="card detailCard"><div class="detailRow"><span>Effective APR</span><strong>${Number((E.effectiveApr?E.effectiveApr(f):f.apr)||0).toFixed(2)}%</strong></div><div class="detailRow"><span>Estimated monthly interest</span><strong>${UI.money(monthlyInterestEstimate(f))}</strong></div><div class="detailRow"><span>Payoff at current minimum</span><strong>${payoffMonthsEstimate(f)===null?"—":payoffMonthsEstimate(f)+" mo"}</strong></div><div class="detailRow"><span>With extra $100/month</span><strong>${payoffMonthsEstimate(f,100)===null?"—":payoffMonthsEstimate(f,100)+" mo"}</strong></div></div>`:""}`;show("command");},
    accountTypeChanged(){
      const type=String(UI.byId("formType")?.value||"").toLowerCase();
      const foundation=type.includes("emergency")||type.includes("retirement");
      UI.byId("debtFields")?.classList.toggle("hidden",foundation);
      UI.byId("promoCard")?.classList.toggle("hidden",foundation);
      const nameInput=UI.byId("formName");
      if(nameInput)nameInput.placeholder=foundation?"e.g., Emergency Fund":"e.g., Chase Freedom";
      const help=UI.byId("accountTypeHelp");
      if(help)help.textContent=foundation?"Foundation accounts track what you are building.":"Debt accounts track what you are paying down.";
    },
    finishSetup(){data.reviewDay=UI.byId("setupDay").value;data.reviewTime=UI.byId("setupTime").value||"7:30 PM";data.strategy=UI.byId("setupStrategy").value;data.setupComplete=true;if(!data.seasonSince)data.seasonSince=new Date().toLocaleDateString(undefined,{month:"long",year:"numeric"});saveRender("command");},
    startReview(){if(!activeAccounts().length){renderAccountForm();return;}if(data.review.status==="complete"){render("review");return;}if(data.review.status!=="inProgress"&&data.review.status!=="allUpdated"&&data.review.status!=="paidOffPrompt"){data.review={status:"ready",index:0,draft:{},notes:{},lastCompleted:data.review?.lastCompleted||null,nextReview:"Next Thursday",pendingPaidOff:null,pendingReflection:null,reviewDate:betaMode()?betaDefaultReviewDate():null};}saveRender("review");},
    beginNewReview(){const picked=UI.byId("betaReviewDateStart")?.value||betaDefaultReviewDate();data.review={status:"inProgress",index:0,draft:{},notes:{},reviewDate:betaMode()?picked:null,lastCompleted:data.review?.lastCompleted||null,nextReview:"Next Thursday",pendingPaidOff:null,pendingReflection:null};saveRender("review");},
    cancelReview(){saveRender("command");},
    saveAccountReview(){const accounts=reviewAccounts();const account=accounts[data.review.index];const input=UI.byId("todayBalance");if(!account||!input)return;const value=Number(input.value)||0;data.review.draft=data.review.draft||{};data.review.notes=data.review.notes||{};data.review.draft[account.id]=value;if(value===0 && !account.paidOff){data.review.status="paidOffPrompt";data.review.pendingPaidOff={accountId:account.id};saveRender("review");return;}const delta=accountDelta(account,value);if(Math.abs(delta)>=1){data.review.status="reflection";data.review.pendingReflection={accountId:account.id,previous:Number(account.balance)||0,current:value,delta};saveRender("review");return;}advanceReview();},
    backFromPaidOffPrompt(){data.review.status="inProgress";data.review.pendingPaidOff=null;saveRender("review");},
    backFromReflection(){data.review.status="inProgress";data.review.pendingReflection=null;saveRender("review");},
    continueAfterReflection(){advanceReview();},
    addReflectionNote(){const pending=data.review.pendingReflection;if(!pending)return;const note=prompt("Add a short note", data.review.notes?.[pending.accountId] || "");if(note!==null){data.review.notes=data.review.notes||{};data.review.notes[pending.accountId]=note.trim();save();}advanceReview();},
    confirmPaidOff(){const pending=data.review.pendingPaidOff;const account=data.accounts.find(a=>a.id===pending?.accountId);if(account){data.review.draft[account.id]=0;completeAccount(account);}advanceReview();},
    notPaidOffYet(){advanceReview();},
    resumeLastAccount(){data.review.status="inProgress";data.review.index=Math.max(0,(data.review.index||0)-1);saveRender("review");},
    closeWeek(){const observations=weeklyObservations();const reflection=weeklyReflectionSentence(observations);const notices=patternNotices(true);const accounts=reviewAccounts();accounts.forEach(a=>{if(data.review.draft&&data.review.draft[a.id]!==undefined && !a.paidOff)a.balance=Number(data.review.draft[a.id])||0;});const completedAt=reviewTimestamp();data.review.status="complete";data.review.lastCompleted=completedAt;const allVisible=E.allAccounts(data).filter(a=>!a.archived);data.snapshots.push({date:completedAt,beta:Boolean(betaMode()),totalBalance:E.totalBalance(activeAccounts(data)),focusAccountId:focus()?.id||null,reflection,observations,patternNotices:notices,notes:data.review.notes||{},accounts:allVisible.map(a=>({id:a.id,name:a.name,type:a.type||"Account",balance:a.balance,paidOff:Boolean(a.paidOff)}))});save();renderWeekClosed();},
    showAddAccount(){renderAccountForm();},
    showAccountDetail(node){const account=data.accounts.find(a=>a.id===node.dataset.id);if(account)renderAccountDetail(account);},
    manageAccount(node){const account=data.accounts.find(a=>a.id===node.dataset.id);if(account)renderManageAccount(account);},
    editAccount(node){const account=data.accounts.find(a=>a.id===node.dataset.id);if(account)renderAccountForm(account);},
    markPaidOff(node){const account=data.accounts.find(a=>a.id===node.dataset.id);if(account){completeAccount(account);save();renderAccountDetail(account);}},
    backToAccounts(){renderAccounts();show("accounts");},
    showFutureChanges(){renderFutureChanges();},
    showFutureChangeForm(){renderFutureChangeForm();},
    showFutureChangeDetail(node){const change=futureChanges().find(c=>c.id===node.dataset.id);if(change)renderFutureChangeDetail(change);},
    editFutureChange(node){const change=futureChanges().find(c=>c.id===node.dataset.id);if(change)renderFutureChangeForm(change);},
    saveFutureChange(node){data.futureChanges=data.futureChanges||[];let change=data.futureChanges.find(c=>c.id===node.dataset.id);if(!change){change={id:`fc_${Date.now()}`,status:"planned",archived:false};data.futureChanges.push(change);}change.type=UI.byId("futureType")?.value||"other";change.title=UI.byId("futureTitle")?.value||changeTypeLabel(change.type);change.date=UI.byId("futureDate")?.value||"";change.amount=Number(UI.byId("futureAmount")?.value)||0;change.frequency=UI.byId("futureFrequency")?.value||"monthly";const targets=Array.from(document.querySelectorAll(".futureAllocTarget"));change.allocations=targets.map((el,i)=>({target:el.value,mode:document.querySelectorAll(".futureAllocMode")[i]?.value||"percent",value:Number(document.querySelectorAll(".futureAllocValue")[i]?.value)||0})).filter(a=>a.target&&a.value>0);change.destination="";change.destinationAccountId="";change.note=UI.byId("futureNote")?.value||"";change.status="planned";save();renderFutureChangeDetail(change);},
    completeFutureChange(node){const change=data.futureChanges?.find(c=>c.id===node.dataset.id);if(change){change.status="complete";change.completedAt=new Date().toISOString();saveRender("accounts");renderFutureChanges();}},
    snoozeFutureChange(node){const change=data.futureChanges?.find(c=>c.id===node.dataset.id);if(change){const d=new Date();d.setDate(d.getDate()+30);change.date=d.toISOString().slice(0,10);save();renderFutureChangeDetail(change);}},
    archiveFutureChange(node){const change=data.futureChanges?.find(c=>c.id===node.dataset.id);if(change&&confirm("Archive this future change?")){change.archived=true;save();renderFutureChanges();}},
    saveAccount(node){const id=node.dataset.id;let account=data.accounts.find(a=>a.id===id);if(!account){account={id:`acct_${Date.now()}`,archived:false,paidOff:false,completedAt:null};data.accounts.push(account);}account.name=UI.byId("formName").value||"Account";account.type=UI.byId("formType").value;account.balance=Number(UI.byId("formBalance").value)||0;const foundation=isFoundation(account);if(foundation){account.apr=0;account.min=0;account.statementDay="";account.promoEnabled=false;account.promoApr=0;account.promoExpires="";account.standardApr=0;account.promoReminderEnabled=false;account.promoReminderDays=30;}else{account.apr=Number(UI.byId("formApr")?.value)||0;account.min=Number(UI.byId("formMin")?.value)||0;account.statementDay=UI.byId("formStatementDay")?.value||"";account.promoEnabled=Boolean(UI.byId("formPromo")?.checked);account.promoApr=Number(UI.byId("formPromoApr")?.value)||0;account.promoExpires=UI.byId("formPromoExpires")?.value||"";account.standardApr=Number(UI.byId("formStandardApr")?.value)||account.apr;account.promoReminderEnabled=account.promoEnabled && Boolean(UI.byId("formPromoReminder")?.checked);account.promoReminderDays=Number(UI.byId("formPromoReminderDays")?.value)||30;}account.note=UI.byId("formNote").value||"";if(!data.startingAmount)data.startingAmount=E.totalBalance(activeAccounts(data));save();renderAccountDetail(account);},
    archiveAccount(node){const account=data.accounts.find(a=>a.id===node.dataset.id);if(account&&confirm("Archive this account?")){account.archived=true;saveRender("accounts");}},
    exportBalancesExcel(){exportBalancesExcel();},
    exportData(){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download="seasons-backup.json";link.click();},
    resetAll(){if(confirm("Reset all local Seasons data?")){data=window.CCStorage.reset();location.reload();}},
    editReviewDay(){renderDayPicker();},
    setReviewDay(node){data.reviewDay=node.dataset.value;saveRender("settings");},
    editReviewTime(){const next=prompt("Review time",data.reviewTime||"7:30 PM");if(next!==null&&next.trim()){data.reviewTime=next.trim();saveRender("settings");}},
    editStrategy(){renderStrategyPicker();},
    setStrategy(node){data.strategy=node.dataset.value;saveRender("settings");},
    tapVersion(){versionTapCount+=1;if(versionTapCount>=5){data.devMode=true;saveRender("settings");}},
    forceUpdateCheck(){checkForUpdate(false);},
    async reloadUpdate(){await clearCaches();location.reload();},
    async clearAppCache(){await clearCaches();alert("Cache cleared. Reloading Seasons.");location.reload();},
    loadDemoData(){if(confirm("Replace local data with demo data?")){loadDemoDataset();}},
    backToSettings(){renderSettings();show("settings");}
  };

  function handleClick(event){const actionTarget=event.target.closest("[data-action]");if(actionTarget){const action=actionTarget.dataset.action;if(actions[action]){actions[action](actionTarget);return;}}const screenTarget=event.target.closest("[data-screen]");if(screenTarget){const id=screenTarget.dataset.screen;render(id);}}
  document.addEventListener("click",handleClick);
  if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{});}
  render(data.setupComplete?"command":"onboarding");
  setTimeout(()=>document.getElementById("splash")?.classList.add("hiddenSplash"),900);
  setTimeout(()=>checkForUpdate(true),800);
})();
