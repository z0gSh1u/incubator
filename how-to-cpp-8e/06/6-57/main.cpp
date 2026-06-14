#include <iostream>
#include <ctime>
#include <cstdlib>
using namespace std;

int randGen()
{
	return rand()%(9-0+1)+0;
}

char calGen()
{
	int c=rand()%(4-1+1)+1;
	switch(c)
	{
	case 1: return '+';
	case 2: return '-';
	case 3: return '*';
	case 4: return '/';
	}
}

bool isCor(int a, int b, char cal, int ans)
{
	switch(cal)
	{
	case '+': return (ans==(a+b));
	case '-': return (ans==(a-b));
	case '*': return (ans==(a*b));
	case '/': return (ans==(a/b));
	}
}

char* resGen(bool isCor)
{
	int a=rand()%(4-1+1)+1;
	switch(a)
	{
	case 1: if (isCor) return "Very good!"; else return "No. Please try again. ";
	case 2: if (isCor) return "Excellent!"; else return "Wrong. Try once more. ";
	case 3: if (isCor) return "Nice work!"; else return "Don't give up! ";
	case 4: if (isCor) return "Keep up the good work!"; else return "No. Keep trying. ";
	}
}

int main()
{
	srand(time(NULL));
	int a,b,ans;
	char cal;
	a=randGen();
	b=randGen();
	cal=calGen();
	bool isC;
	while (1)
	{
		cout << "How much is " << a << ' ' << cal << ' ' << b << "? ";
		cin >> ans;
		isC=isCor(a,b,cal,ans);
		cout << resGen(isC);
		if (isC) break;
	}
	system("pause");
	return 0;
}