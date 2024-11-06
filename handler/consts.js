export const domesticCategories = ["Airline", "Blocked", "Call Forward", "Call Waiting", "Cust Service", "Directory Enquiries", "Mobile", "Opp Assistance", "Toll Free", "Voicemail"];
export const roamingCategories = ["Data Abroad", "Roam MMS - ", "Roam SMS - ", "Roam MO -", "Roam MT - ", "Outgoing Roamed Call -", "Incoming Call - Sea"];

export const getCategory = (props) => {
  if (props.includes("International - ")) return "International Calls (US to Abroad)";
  else if (roamingCategories.find((category) => props.includes(category))) return "Roaming Usage";
  else if (props.match(/(\w+)\sData$/g)?.length > 0) {
    if (props.includes("USA")) return "Domestic";
    else return "Roaming Usage";
  } else if (props.match(/^Outgoing Call - Home - (\w+)/g)?.length > 0) {
    if (domesticCategories.find((category) => props.includes(category))) return "Domestic";
    else return "International Calls (US to Abroad)";
  } else return "Domestic";
};
