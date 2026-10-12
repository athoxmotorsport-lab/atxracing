import json,unittest
from pathlib import Path
from PIL import Image
import sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from evo_catalogue import render
class Catalogue(unittest.TestCase):
 def test_complete_distinct_models_and_assets(self):
  data=json.loads((ROOT/'data/evo-catalogue.json').read_text())
  self.assertEqual(len(data['cars']),74);self.assertEqual(len(data['circuits']),19)
  self.assertEqual(len({x['key'] for x in data['cars']}),74)
  for group in ['cars','circuits']:
   for item in data[group]:
    with self.subTest(item=item['name']):
     path=ROOT/'media'/item['image'];self.assertTrue(path.is_file())
     with Image.open(path) as im:self.assertGreater(im.width,100)
     if group=='cars':
      thumb=ROOT/'media'/item['image'].replace('evo/cars/','evo/cars/thumbs/').replace('gt3/','gt3/thumbs/')
      with Image.open(thumb) as im:
       self.assertEqual(im.height,200);self.assertLessEqual(im.width,360);self.assertIn('A',im.getbands());self.assertEqual(im.getpixel((0,0))[3],0)
  bmw=next(x for x in data['cars'] if x['name']=='BMW M4 GT3 EVO')
  self.assertIn('evo/cars/',bmw['image'])
 def test_bilingual_gallery_does_not_open_registration(self):
  for lang in ['fr','en']:
   cars=render(lang,'cars');tracks=render(lang,'circuits')
   self.assertEqual(cars.count('class="evo-car-card"'),74)
   self.assertEqual(tracks.count('class="evo-circuit-card"'),19)
   self.assertEqual(tracks.count('class="circuit-country-frame"'),19)
   self.assertEqual(cars.count('loading="lazy"'),74)
   self.assertNotIn('race-registration',cars)
   self.assertIn('Catalogue officiel' if lang=='fr' else 'Official catalogue',cars)
   self.assertIn('Illustration du lieu' if lang=='fr' else 'Location illustration',tracks)
if __name__=='__main__':unittest.main()
