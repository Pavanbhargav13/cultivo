import time
import random
import requests
from datetime import datetime

API_URL = "http://localhost:8000/sensors/data"

def generate_data():
    hour = datetime.now().hour
    
    # Simulate day/night cycles
    if 6 <= hour <= 18:
        # Day time
        temp = random.uniform(22.0, 28.0)
        humidity = random.uniform(50.0, 65.0)
        light = random.uniform(500.0, 1000.0)
    else:
        # Night time
        temp = random.uniform(15.0, 20.0)
        humidity = random.uniform(60.0, 80.0)
        light = random.uniform(0.0, 10.0)
        
    # Simulate random anomaly
    if random.random() < 0.05:
        temp = random.uniform(32.0, 40.0) # High temp anomaly
        
    return [
        {"sensor_type": "temperature", "value": round(temp, 2), "unit": "C"},
        {"sensor_type": "humidity", "value": round(humidity, 2), "unit": "%"},
        {"sensor_type": "light", "value": round(light, 2), "unit": "lux"},
        {"sensor_type": "soil_moisture", "value": round(random.uniform(30.0, 60.0), 2), "unit": "%"},
        {"sensor_type": "co2", "value": round(random.uniform(400.0, 800.0), 2), "unit": "ppm"},
        {"sensor_type": "nutrition", "value": round(random.uniform(10.0, 20.0), 2), "unit": "%"}
    ]

def main():
    print("Starting greenhouse simulator...")
    while True:
        data_points = generate_data()
        for point in data_points:
            try:
                response = requests.post(API_URL, json=point)
                if response.status_code == 200:
                    print(f"Sent {point['sensor_type']}: {point['value']} {point['unit']}")
                else:
                    print(f"Failed to send data: {response.status_code} - {response.text}")
            except requests.exceptions.ConnectionError:
                print("Connection to API failed. Is the server running?")
                time.sleep(5)
                break
        
        print("-" * 30)
        # Wait 5 seconds before next reading
        time.sleep(5)

if __name__ == "__main__":
    main()
