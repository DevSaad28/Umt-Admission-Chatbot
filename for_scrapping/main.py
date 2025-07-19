from bs4 import BeautifulSoup
import requests
import json

url = "https://www.umt.edu.pk/oce/FAQs.aspx"
headers = {
    "Referer": "https://www.umt.edu.pk/oce/FAQs.aspx",
    "User-Agent": "Mozilla/5.0 (Linux i651 x86_64) AppleWebKit/533.6 (KHTML, like Gecko) Chrome/55.0.1337.232 Safari/535"
}
response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.text, "html.parser")

main_div = soup.find("div", {"id": "MainContent_pnlArticle"})
form = main_div.find("form")
all_paragraphs = form.find_all("p", recursive=False)

current_category = None
structured_data = {}

for p in all_paragraphs:
    category_span = p.find("span", style="text-decoration: underline;")
    if category_span:
        current_category = category_span.get_text(strip=True)
        structured_data[current_category] = []
        continue
    
    question_text = p.get_text(strip=True)
    if question_text.startswith("Q."):
        iframe = p.find("iframe")
        if not iframe:
            next_p = p.find_next_sibling("p")
            iframe = next_p.find("iframe") if next_p else None
        
        video_link = None
        if iframe and (src := iframe.get("src")):
            video_link = src
        
        if current_category:
            structured_data[current_category].append({
                "question": question_text,
                "video_link": video_link
            })

json_output = json.dumps(structured_data, indent=2)
print(json_output)

with open("final_faqs.json", "w", encoding="utf-8") as f:
    f.write(json_output)