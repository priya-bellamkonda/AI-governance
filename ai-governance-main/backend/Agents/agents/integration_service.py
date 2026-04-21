import os
import requests
from typing import List, Dict, Any
from atlassian import Jira, Confluence
from dotenv import load_dotenv

load_dotenv()

class AtlassianIntegration:
    def __init__(self):
        self.url = os.getenv("ATLASSIAN_URL")
        self.username = os.getenv("ATLASSIAN_EMAIL")
        self.password = os.getenv("ATLASSIAN_API_TOKEN")
        self.jira = None
        self.confluence = None

    def _init_jira(self):
        if not self.jira and all([self.url, self.username, self.password]):
            self.jira = Jira(
                url=self.url,
                username=self.username,
                password=self.password,
                cloud=True
            )
        return self.jira

    def _init_confluence(self):
        if not self.confluence and all([self.url, self.username, self.password]):
            self.confluence = Confluence(
                url=self.url,
                username=self.username,
                password=self.password,
                cloud=True
            )
        return self.confluence

    def fetch_jira_issues(self, jql: str = "issuetype = Epic") -> List[Dict[str, Any]]:
        jira = self._init_jira()
        if not jira:
            return []
        
        try:
            issues = jira.jql(jql)
            results = []
            for issue in issues.get('issues', []):
                results.append({
                    "id": issue['key'],
                    "title": issue['fields']['summary'],
                    "description": issue['fields'].get('description', ''),
                    "status": issue['fields']['status']['name'],
                    "source": "jira"
                })
            return results
        except Exception as e:
            print(f"Error fetching Jira issues: {e}")
            return []

    def fetch_confluence_pages(self, space: str = None) -> List[Dict[str, Any]]:
        confluence = self._init_confluence()
        if not confluence:
            return []

        try:
            results = []
            spaces_to_check = [space] if space else []
            
            # If no space provided, let's find the first few spaces
            if not space:
                all_spaces = confluence.get_all_spaces(start=0, limit=3)
                spaces_to_check = [s['key'] for s in all_spaces.get('results', [])]

            for s_key in spaces_to_check:
                pages = confluence.get_all_pages_from_space(s_key, start=0, limit=5, expand='body.storage')
                for page in pages:
                    raw_html = page.get('body', {}).get('storage', {}).get('value', 'No content available...')
                    # Simple regex to strip HTML/Macro tags for cleaner display
                    import re
                    clean_text = re.sub('<[^<]+?>', '', raw_html).strip()
                    # Remove multiple spaces/newlines
                    clean_text = re.sub('\s+', ' ', clean_text)
                    
                    results.append({
                        "id": page['id'],
                        "title": page['title'],
                        "category": "Other",
                        "description": clean_text[:500] + ("..." if len(clean_text) > 500 else ""),
                        "source": "confluence"
                    })
            return results
        except Exception as e:
            print(f"Error fetching Confluence pages: {e}")
            return []

integration_service = AtlassianIntegration()
