// ============================================================
// SVA Kickstart — API client (talks to the Apps Script backend)
// Falls back to DEMO mode when API_URL is empty or ?demo is in
// the URL, so the site can be previewed without a backend.
// ============================================================

const API = (() => {
  const url = (window.KICKSTART_CONFIG || {}).API_URL || '';
  const demo = !url || new URLSearchParams(location.search).has('demo');

  async function call(payload) {
    if (demo) return demoCall(payload);
    const res = await fetch(url, {
      method: 'POST',
      // text/plain avoids a CORS preflight, which Apps Script can't answer
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('network');
    return res.json();
  }

  // ------------------------------------------------ demo backend ----
  const DEMO_STATE = {
    ok: true,
    familyId: 'F-1001',
    students: [
      { id: 'S-2001', name: 'Yusuf', grade: 'PreK' },
      { id: 'S-2002', name: 'Maryam', grade: '3' },
      { id: 'S-2003', name: 'Omar', grade: '7' },
    ],
    links: {
      calendar_pdf: { label: 'School Calendar (PDF)', url: 'https://drive.google.com/file/d/1MPZfxfCALuHFcJWdu7zTRc60VXjv9wqy/view?usp=sharing' },
      calendar_gcal: { label: 'Google Calendar', url: 'https://calendar.google.com/calendar/u/0/newembed?src=svaschool.org_us4ga4j1cfs27epj0f2dfegcl0@group.calendar.google.com&ctz=America/Los_Angeles' },
      uniform_policy: { label: 'Uniform Policy (PDF)', url: 'https://drive.google.com/file/d/1hiFChOHQVLxFbiU0I7drBEZF0FKhWzux/view?usp=sharing' },
      potluck_rsvp: { label: 'Potluck RSVP', url: 'https://svapotluck.gzring.com' },
      parent_portal: { label: 'Parent Portal', url: 'https://svaportal.com' },
      supply_list: { label: 'Official supply list document', url: 'https://svaportal.com' },
      conduct_prek: { label: 'PreK Behavior & Support Policy', url: 'https://docs.google.com/document/d/1hYHma0sz8YpLHJAudlwXB5pm-CQA3DwBdjRNTDfc20M/edit?usp=sharing' },
      conduct_k8: { label: 'Student Conduct & Character Policy', url: 'https://docs.google.com/document/d/187T0y7Ic7j7ZtC9yIPJUWJaeriT1gMHjqKcbZej4FAE/edit?usp=sharing' },
      whatsapp_prek: { label: 'PreK WhatsApp Group', url: '#' },
      whatsapp_3: { label: '3rd Grade WhatsApp Group', url: '#' },
      whatsapp_7: { label: '7th Grade WhatsApp Group', url: '#' },
    },
    events: [
      { date: '2026-08-14', title: 'Orientation', description: "Come meet us in the classroom any time between 10 AM – 1 PM. Please bring your child's supplies in a labeled bag or small box.", emoji: '🏫', audience: 'all' },
      { date: '2026-08-16', title: 'PTO Potluck Picnic', description: 'Meet fellow parents and students at Washington Park, Sunnyvale, 11:00 AM – 3:00 PM — and bring a dish to share!', emoji: '🧺', audience: 'all' },
      { date: '2026-08-17', title: 'First Day of School', description: 'Please park and walk your child into their classroom.', emoji: '🎒', audience: 'all' },
      { date: '2026-08-19', title: 'Drop-off Routine Begins', description: 'KG–8th graders may be dropped off in the drop-off lane adjacent to the gymnasium. PreK drop-off stays in person at the classroom.', emoji: '🚗', audience: 'all' },
      { date: '2026-08-24', title: 'Hot Lunch Begins', description: 'Hot lunch offered every school day. Explore the menu on the parent portal starting 8/7.', emoji: '🍱', audience: 'all' },
    ],
    config: {
      school_name: 'Silicon Valley Academy',
      first_day: '2026-08-17',
      hotlunch_note: 'Hot lunch starts 8/24 and is offered all school days. Explore the menu at the parent portal starting 8/7.',
      office_email: 'office@svaschool.org',
    },
    progress: {},
  };

  async function demoCall(payload) {
    await new Promise(r => setTimeout(r, 350)); // simulate network
    switch (payload.action) {
      case 'requestCode': return { ok: true, demoHint: 'Demo mode: use code 123456' };
      case 'verifyCode':
        if (String(payload.code).trim() !== '123456') return { ok: false, error: 'bad_code' };
        return { ...structuredClone(DEMO_STATE), token: 'demo-token', progress: JSON.parse(localStorage.getItem('demoProgress') || '{}') };
      case 'getState':
        return { ...structuredClone(DEMO_STATE), progress: JSON.parse(localStorage.getItem('demoProgress') || '{}') };
      case 'saveProgress':
        localStorage.setItem('demoProgress', JSON.stringify(payload.progress || {}));
        return { ok: true };
      case 'signPolicy':
        return { ok: true, fileUrl: '#demo-signed-pdf' };
      default:
        return { ok: true };
    }
  }

  return {
    demo,
    requestCode: (email) => call({ action: 'requestCode', email }),
    verifyCode: (email, code) => call({ action: 'verifyCode', email, code }),
    getState: (email, token) => call({ action: 'getState', email, token }),
    saveProgress: (email, token, progress) => call({ action: 'saveProgress', email, token, progress }),
    submit: (email, token, type, data) => call({ action: 'submit', email, token, type, data }),
    signPolicy: (email, token, p) => call({ action: 'signPolicy', email, token, ...p }),
    emailSupplies: (email, token, lists) => call({ action: 'emailSupplies', email, token, lists }),
    emailSummary: (email, token, html) => call({ action: 'emailSummary', email, token, html }),
  };
})();
