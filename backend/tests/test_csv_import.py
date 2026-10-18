import unittest

from backend.services.csv_import import parse_observation_csv


class CsvImportTests(unittest.TestCase):
    def test_unicode_bom_headers_and_quoted_multiline_text(self):
        rows = parse_observation_csv('\ufeff Description ,Location\n"गैस लीक,\nnear pump",Digboi\n')
        self.assertEqual(rows[0]['text'], 'गैस लीक,\nnear pump')
        self.assertEqual(rows[0]['location'], 'Digboi')

    def test_alternate_text_column_when_primary_is_empty(self):
        self.assertEqual(parse_observation_csv('text,narrative\n,Gas leak\n')[0]['text'], 'Gas leak')

    def test_missing_header_empty_and_malformed_files_rejected(self):
        for content in ('', 'location\nDigboi\n', 'text\n', 'text\nx\n', 'text,shift\nGas leak\n', 'text\n"unclosed'):
            with self.subTest(content=content), self.assertRaises(ValueError):
                parse_observation_csv(content)

    def test_oversized_batch_rejected_instead_of_silently_truncated(self):
        self.assertEqual(len(parse_observation_csv('text\n' + 'Gas leak\n' * 500)), 500)
        with self.assertRaisesRegex(ValueError, 'exceeds 500'):
            parse_observation_csv('text\n' + 'Gas leak\n' * 507)

    def test_invalid_later_row_rejects_entire_upload(self):
        with self.assertRaisesRegex(ValueError, 'line 3'):
            parse_observation_csv('text\nValid observation\nx\n')

    def test_long_text_and_duplicate_headers_rejected(self):
        for content in ('text\n' + 'x' * 10001, 'text,TEXT\nGas leak,Gas leak'):
            with self.assertRaises(ValueError):
                parse_observation_csv(content)


if __name__ == '__main__':
    unittest.main()
