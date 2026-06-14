/* 7-24 c) */ 

#include <iostream>
#include <cstdlib>

using namespace std;

// Variable Definition
int board[8][8]={0};
int horizontal[8]={2,1,-1,-2,-2,-1,1,2};
int vertical[8]={-1,-2,-2,-1,1,2,2,1};
int accessibility[8][8]=
						{	{2,3,4,4,4,4,3,2},
							{3,4,6,6,6,6,4,3},
							{4,6,8,8,8,8,6,4},
							{4,6,8,8,8,8,6,4},
							{4,6,8,8,8,8,6,4},
							{4,6,8,8,8,8,6,4},
							{3,4,6,6,6,6,4,3},
							{2,3,4,4,4,4,3,2}	};
int currentRow, currentColumn;
int tourCount=0, moveCount=0;
int idealRow, idealColumn;
int lowAcc=666;
bool visited[8][8]={0};
bool tourOK=false;
// End Definition

bool canGo(int cR, int cC, int movetype)
{
	return ( (cR + vertical[movetype] < 8 ) && (cR + vertical[movetype] >=0 ) &&
		(cC + horizontal[movetype] < 8 ) && (cC + horizontal[movetype] >=0 ) );
}

void printBoard()
{
	for (int i=0; i<=7; i++)
	{
		for (int j=0; j<=7; j++)
			cout << board[i][j] << ' ';
		cout << endl;
	}
}		 

void resetVis()
{
	for (int i=0; i<=7; i++)
		for (int j=0; j<=7; j++)
			visited[i][j]=false;
}

void goSeeSee(int x, int y)
{
	for (int i=0; i<=7; i++)
		if (canGo(x,y,i) && !visited[x + vertical[i]][y + horizontal[i]]) 
		{

			moveCount++;
			goSeeSee(x + vertical[i], y + horizontal[i]);
			
		}
	if (moveCount==64) tourOK=true;
}

int main()
{
	for (int i=0; i<=7; i++)
		for (int j=0; j<=7; j++)
		{
			tourOK=false;
			resetVis();
			currentRow=i;
			currentColumn=j;
			goSeeSee(currentRow,currentColumn);
			if (tourOK) board[currentRow][currentColumn]++;
		}

	system("pause");

	return 0;
}