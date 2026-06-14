#include <iostream>
#include <cstdlib>

using namespace std;

int bucket[10][1000];

int my10Pow(int t)
{
	int a=1;
	for (int i=1; i<=t; i++) a*=10;
	return a;
}

void initBucket()
{
	for (int i=0; i<10; i++)
		for (int j=0; j<1000; j++)
			bucket[i][j]=-1;
}

void bucketSort(int a[], int arrSize)
{
	// find the longest
	int Max=-1;
	for (int i=0; i<arrSize; i++)
		if (a[i]>Max) Max=a[i];
	int Len=0;
	while (Max!=0) 
	{	Max/=10;	Len++;	}

	// put into bucket
	int Level=1;
	while (Level<=Len)
	{
		int currentBit, bak, taken=0;
		for (int i=0; i<arrSize; i++)
		{
			bak=a[i];
			bak/=my10Pow(Level-1);
			currentBit=bak%10;
			bucket[currentBit][taken]=a[i];
			taken++;
		}
		taken=0;
		for (int i=0; i<10; i++)
			for (int j=0; j<1000; j++)
				if (bucket[i][j]!=-1) { a[taken]=bucket[i][j]; taken++; }
		Level++;
		initBucket();
	}
}

int main()
{
	int a[100],n;
	cin >> n;
	for (int i=0; i<n; i++)
		cin >> a[i];
	initBucket();
	bucketSort(a,n);
	for (int i=0; i<n; i++)
		cout << a[i] << ' ';
	system("pause");
	return 0;
}