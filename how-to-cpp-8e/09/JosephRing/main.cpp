#include <iostream>
#include <cstdlib>

#define MONKEY_NUM	5
#define START_NUM	1
#define LUCKY_NUM	3

using namespace std;

/* Method 1: Simulate */
void solve_1()
{
	bool isOut[MONKEY_NUM+1]={0};  // 12345
	int nOut=0, k=0, now=START_NUM;
	while (1)
	{
		if (now>MONKEY_NUM) now=1;
		if (!isOut[now]) k++;
		if (k==LUCKY_NUM && nOut==MONKEY_NUM-1) break;
		if (k==LUCKY_NUM) { isOut[now]=true; nOut++; k=0; }
		now++;
	}
	cout << now << endl << endl;
}

/* Method 2: STL Vector */
#include <vector>
void solve_2()
{
	vector<int> ring;
	for (int i=START_NUM; i<=MONKEY_NUM; i++)
		ring.push_back(i);
	if (START_NUM!=1)
		for (int i=1; i<START_NUM; i++)
			ring.push_back(i);
	auto iter=ring.begin();
	while (ring.size()>1)
	{
		for (int i=1; i<=LUCKY_NUM-1; i++)
		{
			iter++;
			if (iter==ring.end()) iter=ring.begin();
		}
		iter=ring.erase(iter);
		if (iter==ring.end()) iter=ring.begin();
	}
	cout << ring[0] << endl << endl;
}

int main()
{
	cout << "*** 解法 1 ***" << endl;
	solve_1();
	cout << "*** 解法 2 (STL vector) ***" << endl;
	solve_2();
	system("pause");
	return 0;
}