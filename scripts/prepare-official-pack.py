from pathlib import Path
import json,zipfile
R=Path(__file__).resolve().parents[1]
c=json.loads((R/'content/official-documents.json').read_text(encoding='utf-8'))
with zipfile.ZipFile(R/'public/documents/official-workshop-pack.zip','w',zipfile.ZIP_DEFLATED) as z:
 for folder in ['text','originals']:
  for p in (R/'public/documents'/folder).glob('*'):
   z.write(p,p.relative_to(R/'public/documents'))
 z.writestr('SOURCE-README.txt','울산대학교 AI 실습 공식 원문 자료 목록\n전체 PDF는 발행기관에서 내려받으세요. 기본 묶음: 편람PDF·업무계획PDF·noticeTXT·regulationTXT·rulesTXT.\ncomplaintsTXT는2026.12.3. 시행예정본 비교용으로 기본 묶음에 넣지 않습니다.\n빈 신청서에는 실제 주민번호·계좌번호를 입력하지 않습니다.\n\n'+'\n\n'.join(d['title']+'\n'+d['sourceUrl']+'\n전체 원문: '+d['downloadUrl']+'\n'+d['useNote'] for d in c['documents']))
