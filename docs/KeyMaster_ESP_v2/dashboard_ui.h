#ifndef DASHBOARD_UI_H
#define DASHBOARD_UI_H

const char DASHBOARD_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>KeyMaster Emergency</title>
    <style>
        body { font-family: sans-serif; text-align: center; background: #f1f5f9; color: #1e293b; padding: 20px; }
        .card { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 350px; margin: 0 auto; }
        h1 { color: #144b89; font-size: 24px; margin-bottom: 5px; }
        .status { font-weight: bold; padding: 5px 15px; border-radius: 50px; font-size: 12px; display: inline-block; margin-bottom: 20px; border: 1px solid #e2e8f0; }
        .open { color: #ef4444; background: #fef2f2; border-color: #fecaca; }
        .locked { color: #10b981; background: #ecfdf5; border-color: #d1fae5; }
        input { width: 100%; padding: 12px; margin: 10px 0; border: 2px solid #e2e8f0; border-radius: 10px; box-sizing: border-box; font-size: 16px; font-weight: bold; }
        button { width: 100%; padding: 15px; background: #144b89; color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: bold; cursor: pointer; margin-top: 15px; }
        button:disabled { background: #cbd5e1; }
        #msg { font-size: 12px; margin-top: 15px; color: #64748b; }
    </style>
</head>
<body>
    <div class="card">
        <h1>KeyMaster <span style="color:#f59e0b">Pro</span></h1>
        <p style="font-size:12px; margin-bottom:20px">EMERGENCY OFFLINE ACCESS</p>
        
        <div id="st" class="status locked">DOOR SECURED</div>

        <input type="password" id="sid" placeholder="4-DIGIT STAFF ID" maxlength="4" inputmode="numeric">
        <input type="password" id="pin" placeholder="4-DIGIT PIN" maxlength="4" inputmode="numeric">

        
        <button id="ub" onclick="unlock()">UNLOCK CABINET</button>
        <p id="msg"></p>
        <p style="margin-top:25px; border-top: 1px border-slate-100 pt-3;"><a href="/" style="color:#64748b; font-size:11px; text-decoration:none;">⚙️ RETURN TO WIFI SETTINGS</a></p>
    </div>


    <script>
        let token = "";
        
        async function fetchStatus() {
            try {
                let r = await fetch('/status');
                let d = await r.json();
                let st = document.getElementById('st');
                st.innerText = d.doorOpen ? 'DOOR OPEN' : 'DOOR SECURED';
                st.className = 'status ' + (d.doorOpen ? 'open' : 'locked');
            } catch(e) {}
        }

        async function unlock() {
            let sid = document.getElementById('sid').value;
            let pin = document.getElementById('pin').value;
            let msg = document.getElementById('msg');
            let btn = document.getElementById('ub');

            if(!sid || pin.length !== 4) { alert('Invalid ID or PIN'); return; }
            
            btn.disabled = true;
            msg.innerText = "Authenticating...";

            try {
                // 1. Login
                let lr = await fetch('/login', {
                    method: 'POST',
                    body: JSON.stringify({ staffId: sid, pin: pin })
                });
                
                if(!lr.ok) throw new Error('Login Failed');
                let ld = await lr.json();
                token = ld.token;

                // 2. Unlock
                msg.innerText = "Authorized. Unlocking...";
                let ur = await fetch('/unlock', {
                    method: 'POST',
                    headers: { 'Authorization': token }
                });

                if(ur.ok) {
                    msg.innerText = "SUCCESS: Cabinet Unlocked!";
                    setTimeout(() => { msg.innerText = ""; btn.disabled = false; }, 5000);
                }
            } catch(e) {
                msg.innerText = "ERROR: Access Denied";
                btn.disabled = false;
            }
        }

        setInterval(fetchStatus, 3000);
        fetchStatus();
    </script>
</body>
</html>
)rawliteral";

#endif
