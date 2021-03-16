# Hangar Export for CHROME

## Download your RSI Pledge and Buyback data into JSON and CSV files

* Zero external libraries used.
* Vanilla Javascript.
* Simple code, Easy to audit.
* Makes no calls to RSI directly from Javascript.
* Adds an Export button and a processing overlay during processing, but does not otherwise adjust the html of your hanger. future hanger changes will should not be impacted for example "Ship Naming".
* Includes all relevant Pledge Data that can be found on each page including Standalone Ship pledges, Package pledges, Upgrade pledges, and all other kinds of pledges.
* Includes all relevant Buyback Data that can be found on each page.
* Includes all Ships and Ship Names found within each pledge.
* Does NOT include Coupon Codes themselves, but does include the pledge without the codes.
* Includes handles.
* Your data is yours. This extension does not upload or send your data anywhere, you are free to use your csv and json files as you choose.
* Use at your own risk - no warranty or support is provided for this extension.
* You can remove this extension any time by opening up a new chrome tab to chrome://extensions and clicking remove

**Always enable Two Factor Authentication on your RSI account before using ANY chrome extension. Note, Email based 2fa is not as secure as Google Authenticator or Authy based 2fa**

**NEVER SHARE A PASSWORD BETWEEN YOUR EMAIL ACCOUNT AND YOUR RSI ACCOUNT**

* Ensure this code is not compressed or zipped (unzip if required)
* Download and install chrome
* Double check you have no other extensions loaded that may affect the RSI website.
* Double check you have 2FA enabled on your RSI account
* Double check your RSI password is not the same as your Email password if you use Email based 2FA
* Type the following into the address bar: chrome://extensions
* Switch on developer mode (toggle on the right top called developer mode)
* Click the button Load unpacked
* Navigate to the folder containing the extracted code
* Open a new tab and browse to https://robertsspaceindustries.com/account/pledges
* Click the export button on the left hand sidebar menu
* Wait for chrome to work its way through your pledge and buybacks pages
* Allow chrome to download two files
* The CSV file can be loaded into spreadsheet software
* The JSON file can be further processed or uploaded to a location to be announced soon to assist with hanger management and ccu chain management.

## Licence 

Copyright (c) Hangar.link

Redistribution and use in source and binary forms, with or without modification are permitted.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
