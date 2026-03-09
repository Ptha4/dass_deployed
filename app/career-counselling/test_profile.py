import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        # Login
        login_data = {
            "email": "expert@example.com",
            "password": "password123"
        }
        r = await client.post("https://dass-deployed.onrender.com/api/login", json=login_data)
        if r.status_code != 200:
            print("Login failed:", r.text)
            return
        
        token = r.json()["token"]
        print("Got token")
        
        # Get profile
        headers = {"Authorization": f"Bearer {token}"}
        r = await client.get("https://dass-deployed.onrender.com/api/profile", headers=headers)
        print("Profile status:", r.status_code)
        
        import json
        print(json.dumps(r.json(), indent=2))

if __name__ == "__main__":
    asyncio.run(main())
