import requests
import sys
import json
from datetime import datetime

class SolarPanelAPITester:
    def __init__(self, base_url="https://solarmaintai.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}/"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:500]
                })
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout after {timeout}s")
            self.failed_tests.append({'name': name, 'error': 'Timeout'})
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({'name': name, 'error': str(e)})
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_dashboard_kpis(self):
        """Test dashboard KPIs endpoint"""
        success, response = self.run_test("Dashboard KPIs", "GET", "dashboard/kpis", 200)
        if success and isinstance(response, dict):
            required_fields = ['current_power_output', 'efficiency_percentage', 'panel_temperature', 
                             'dust_level_index', 'maintenance_status', 'total_panels']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing fields: {missing_fields}")
            else:
                print(f"   ✅ All required KPI fields present")
                print(f"   📊 Power: {response.get('current_power_output', 'N/A')}kW, Efficiency: {response.get('efficiency_percentage', 'N/A')}%")
        return success, response

    def test_performance_data(self):
        """Test performance data endpoint"""
        success, response = self.run_test("Performance Data (7 days)", "GET", "dashboard/performance?days=7", 200)
        if success and isinstance(response, list):
            print(f"   📈 Returned {len(response)} performance records")
            if response:
                sample = response[0]
                required_fields = ['timestamp', 'power_output', 'efficiency']
                missing_fields = [field for field in required_fields if field not in sample]
                if missing_fields:
                    print(f"   ⚠️  Missing fields in data: {missing_fields}")
                else:
                    print(f"   ✅ Performance data structure valid")
        return success, response

    def test_maintenance_alerts(self):
        """Test maintenance alerts endpoint"""
        success, response = self.run_test("Maintenance Alerts", "GET", "dashboard/alerts", 200)
        if success and isinstance(response, list):
            print(f"   🚨 Found {len(response)} alerts")
            if response:
                alert = response[0]
                required_fields = ['id', 'panel_id', 'severity', 'message', 'status']
                missing_fields = [field for field in required_fields if field not in alert]
                if missing_fields:
                    print(f"   ⚠️  Missing fields in alert: {missing_fields}")
                else:
                    print(f"   ✅ Alert structure valid")
                    print(f"   🔍 Sample alert: {alert.get('panel_id', 'N/A')} - {alert.get('severity', 'N/A')}")
        return success, response

    def test_predictions_forecast(self):
        """Test ML predictions endpoint"""
        success, response = self.run_test("ML Predictions Forecast", "GET", "predictions/forecast", 200, timeout=45)
        if success and isinstance(response, dict):
            required_sections = ['next_7_days_power', 'efficiency_forecast', 'maintenance_predictions', 'recommendations']
            missing_sections = [section for section in required_sections if section not in response]
            if missing_sections:
                print(f"   ⚠️  Missing prediction sections: {missing_sections}")
            else:
                print(f"   ✅ All prediction sections present")
                print(f"   🔮 Power forecasts: {len(response.get('next_7_days_power', []))}")
                print(f"   🔮 Efficiency forecasts: {len(response.get('efficiency_forecast', []))}")
                print(f"   🔮 Maintenance predictions: {len(response.get('maintenance_predictions', []))}")
                print(f"   💡 Recommendations: {len(response.get('recommendations', []))}")
        return success, response

    def test_data_import(self):
        """Test CSV data import endpoint"""
        success, response = self.run_test("CSV Data Import", "POST", "data/import", 200, timeout=60)
        if success and isinstance(response, dict):
            if 'records' in response:
                print(f"   📊 Imported {response['records']} records")
            if 'message' in response:
                print(f"   💬 Message: {response['message']}")
        return success, response

    def test_file_upload_validation(self):
        """Test file upload endpoint validation"""
        print("\n🔍 Testing File Upload Validation...")
        
        # Test 1: Missing file
        try:
            response = requests.post(f"{self.api_url}/data/import/file", timeout=30)
            if response.status_code == 422:  # FastAPI validation error
                print("✅ Correctly rejects missing file")
                self.tests_passed += 1
            else:
                print(f"❌ Expected 422 for missing file, got {response.status_code}")
                self.failed_tests.append({
                    'name': 'Missing file validation',
                    'expected': 422,
                    'actual': response.status_code
                })
            self.tests_run += 1
        except Exception as e:
            print(f"❌ Error testing missing file: {e}")
            self.failed_tests.append({'name': 'Missing file validation', 'error': str(e)})
            self.tests_run += 1

        # Test 2: Invalid file type
        try:
            files = {'file': ('test.txt', 'invalid content', 'text/plain')}
            response = requests.post(f"{self.api_url}/data/import/file", files=files, timeout=30)
            if response.status_code == 400:
                print("✅ Correctly rejects non-CSV file")
                self.tests_passed += 1
            else:
                print(f"❌ Expected 400 for invalid file type, got {response.status_code}")
                self.failed_tests.append({
                    'name': 'Invalid file type validation',
                    'expected': 400,
                    'actual': response.status_code
                })
            self.tests_run += 1
        except Exception as e:
            print(f"❌ Error testing invalid file type: {e}")
            self.failed_tests.append({'name': 'Invalid file type validation', 'error': str(e)})
            self.tests_run += 1

    def test_file_upload_with_sample_data(self):
        """Test file upload with sample CSV data"""
        print("\n📁 Testing File Upload with Sample Data...")
        
        # Read sample CSV file
        try:
            with open('/app/sample_solar_data.csv', 'r') as f:
                csv_content = f.read()
            
            files = {'file': ('sample_solar_data.csv', csv_content, 'text/csv')}
            
            print(f"   📄 Uploading sample CSV ({len(csv_content)} bytes)")
            response = requests.post(f"{self.api_url}/data/import/file", files=files, timeout=90)
            
            self.tests_run += 1
            
            if response.status_code == 200:
                self.tests_passed += 1
                print("✅ File upload successful")
                
                try:
                    response_data = response.json()
                    print(f"   📊 Records imported: {response_data.get('records_imported', 'N/A')}")
                    print(f"   📁 Filename: {response_data.get('filename', 'N/A')}")
                    print(f"   📏 File size: {response_data.get('file_size', 'N/A')} bytes")
                    
                    if 'data_summary' in response_data:
                        summary = response_data['data_summary']
                        print(f"   ⚡ Avg Power: {summary.get('avg_power_output', 'N/A'):.1f} kW")
                        print(f"   🔋 Avg Efficiency: {summary.get('avg_efficiency', 'N/A'):.1f}%")
                        print(f"   🔧 Maintenance Required: {summary.get('maintenance_required_count', 'N/A')} panels")
                    
                    if 'date_range' in response_data:
                        date_range = response_data['date_range']
                        print(f"   📅 Date Range: {date_range.get('start', 'N/A')} to {date_range.get('end', 'N/A')}")
                    
                    return True, response_data
                    
                except Exception as e:
                    print(f"   ⚠️  Could not parse response JSON: {e}")
                    return True, response.text
            else:
                print(f"❌ File upload failed - Status: {response.status_code}")
                print(f"   Response: {response.text[:300]}...")
                self.failed_tests.append({
                    'name': 'Sample file upload',
                    'expected': 200,
                    'actual': response.status_code,
                    'response': response.text[:500]
                })
                return False, {}
                
        except FileNotFoundError:
            print("❌ Sample CSV file not found at /app/sample_solar_data.csv")
            self.failed_tests.append({'name': 'Sample file upload', 'error': 'Sample file not found'})
            self.tests_run += 1
            return False, {}
        except Exception as e:
            print(f"❌ Error during file upload: {e}")
            self.failed_tests.append({'name': 'Sample file upload', 'error': str(e)})
            self.tests_run += 1
            return False, {}

    def test_dashboard_updates_after_import(self):
        """Test that dashboard reflects new data after import"""
        print("\n🔄 Testing Dashboard Updates After Import...")
        
        # Get KPIs before and after import to verify changes
        print("   📊 Getting KPIs after data import...")
        success, kpis_after = self.test_dashboard_kpis()
        
        if success:
            print("   ✅ Dashboard KPIs accessible after import")
            return True, kpis_after
        else:
            print("   ❌ Dashboard KPIs not accessible after import")
            return False, {}

    def test_ml_models_after_import(self):
        """Test ML model predictions after data import"""
        print("\n🤖 Testing ML Models After Import...")
        
        # Test predictions to ensure models were retrained
        success, predictions = self.test_predictions_forecast()
        
        if success:
            print("   ✅ ML predictions working after import")
            return True, predictions
        else:
            print("   ❌ ML predictions failed after import")
            return False, {}

    def test_performance_with_different_days(self):
        """Test performance endpoint with different day parameters"""
        test_cases = [1, 3, 7, 30]
        all_passed = True
        
        for days in test_cases:
            success, response = self.run_test(f"Performance Data ({days} days)", "GET", f"dashboard/performance?days={days}", 200)
            if not success:
                all_passed = False
            elif isinstance(response, list):
                print(f"   📈 {days} days: {len(response)} records")
        
        return all_passed

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Solar Panel API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)

        # Test basic connectivity
        print("\n📡 CONNECTIVITY TESTS")
        self.test_root_endpoint()

        # Test data import first (this initializes the system)
        print("\n📊 DATA IMPORT TESTS")
        self.test_data_import()

        # Test enhanced file upload functionality
        print("\n📁 ENHANCED FILE UPLOAD TESTS")
        self.test_file_upload_validation()
        upload_success, upload_response = self.test_file_upload_with_sample_data()
        
        # Test dashboard updates after import
        if upload_success:
            self.test_dashboard_updates_after_import()
            self.test_ml_models_after_import()

        # Test dashboard endpoints
        print("\n📈 DASHBOARD API TESTS")
        self.test_dashboard_kpis()
        self.test_performance_data()
        self.test_maintenance_alerts()

        # Test ML predictions
        print("\n🤖 ML PREDICTION TESTS")
        self.test_predictions_forecast()

        # Test performance with different parameters
        print("\n🔄 PARAMETER VARIATION TESTS")
        self.test_performance_with_different_days()

        # Print final results
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print(f"✅ Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests failed: {len(self.failed_tests)}")
        
        if self.failed_tests:
            print("\n🚨 FAILED TESTS DETAILS:")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"{i}. {test['name']}")
                if 'expected' in test:
                    print(f"   Expected: {test['expected']}, Got: {test['actual']}")
                if 'error' in test:
                    print(f"   Error: {test['error']}")
                if 'response' in test:
                    print(f"   Response: {test['response'][:200]}...")
                print()

        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"🎯 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = SolarPanelAPITester()
    
    try:
        all_passed = tester.run_all_tests()
        return 0 if all_passed else 1
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error during testing: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
