# External Data Sources

FarmEasy AI retrieves regional weather through the public [Open-Meteo Forecast API](https://api.open-meteo.com/v1/forecast). The current integration requests temperature, precipitation, weather code, and wind speed for the Kolar prototype area and presents unavailable states if the source cannot respond.

The live mandi-price adapter uses the [CEDA API](https://api.ceda.ashoka.edu.in/documentation/), which exposes Agmarknet commodity, geography, market, price, and quantity endpoints. CEDA requires bearer-token authorization. The server validates its configured token against the commodity catalogue, then resolves tomato, Karnataka, and Kolar identifiers before requesting recent price observations. Mandi amounts are converted from INR/quintal to INR/kg for the marketplace comparison.

The user-facing AI views distinguish the connected regional signals from the prototype recommendations. They do not claim an exact or guaranteed fair price.
